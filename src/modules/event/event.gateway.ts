/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectRedis } from "@nestjs-modules/ioredis";
import { InjectModel } from "@nestjs/mongoose";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Redis } from "ioredis";
import { ClientSession, Model } from "mongoose";
import { Server, Socket } from "socket.io";

@WebSocketGateway(81, {
    cors: {
        origin: 'http://localhost:3001',
        credentials: true
    }
})
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    private dbSessEnded: boolean = true;

    constructor(
        @InjectModel(Event.name) private eventModel: Model<Event>,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    @WebSocketServer() server: Server;

    afterInit() {
        console.log(`WebSocket Gateway initialized`);
    }

    async getVotesFromRedis(event_id: string) {
        const votes = await this.redis.hget("votes", event_id);
        if (votes) {
            return votes;
        }
        return null
    }
    async handleConnection(client: Socket) {

        if (this.dbSessEnded) {
            const session: ClientSession = await this.eventModel.db.startSession();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            try {
                session.startTransaction();
                const events = await this.eventModel
                    .find({ createdAt: { $gte: oneMonthAgo } })
                    .select("vote");

                events.map(async (e: any) => {
                    try {
                        const id = e._id;
                        const vote = e.vote;
                        const transaction = this.redis.multi();
                        transaction.hset("votes", id, vote);
                        await transaction.exec();
                    } catch (err) {
                        console.log(err)
                    }
                })
                await session.commitTransaction();
            } catch (err) {
                await session.abortTransaction();
            } finally {
                await session.endSession();
            }
        } else {
            const transaction = this.redis.multi();
            transaction.del("votes");
            await transaction.exec();
        }
        console.log(`Client connected: ${client.id}`);
    }


    async handleDisconnect(client: Socket) {
        const votes = await this.redis.hgetall("votes");
        const session: ClientSession = await this.eventModel.db.startSession();
        try {
            this.dbSessEnded = false;
            session.startTransaction();
            const listNames = await this.redis.smembers(`comments`);
            await Promise.all([
                Promise.all(Object.entries(votes).map(([eventId, vote]) => {
                    return this.eventModel.updateOne({ _id: eventId }, { vote: vote });
                })),
                Promise.all(
                    listNames.map(async (listName) => {
                        const list = await this.redis.lrange(listName, 0, -1);
                        await this.redis.del(listName);
                        await this.eventModel.updateOne(
                            { _id: listName.split("comment_")[1] },
                            { $push: { comments: { $each: list } } }
                        );
                    })
                )
            ])
            await session.commitTransaction();
        } catch (error) {
            console.log(error)
            await session.abortTransaction();
            this.dbSessEnded = true;
        } finally {
            await session.endSession();
            this.dbSessEnded = true;
            console.log(session.hasEnded)
            const transaction = this.redis.multi();
            transaction.del("votes");
            await transaction.exec();
        }
        console.log(`Client disconnected: ${client.id} `);
    }

    @SubscribeMessage('vote-yes')
    async handleVote(client: Socket, payload: any): Promise<void> {
        const { event_id, user_id } = payload;
        if (event_id) {
            try {
                const transaction = this.redis.multi();
                transaction.hincrby("yesvotes", event_id, 1);

                transaction.hincrby("yesvotes", event_id, 1);

                await transaction.exec((err, replies) => {
                    if (err) {
                        this.server.emit('voteError', { message: 'Could not cast vote.' });
                        return;
                    }
                    this.server.emit('returnYesVote', { event_id: event_id, vote: replies[0][1] });
                });
            } catch (err) {
                console.log(err)
            }
        }
    }

    @SubscribeMessage('comment')
    async handleMessage(client: Socket, payload: { message: string, event_id: string, username: string }): Promise<void> {
        const { message, event_id, username } = payload;
        if (message && event_id && username) {
            try {
                const transaction = this.redis.multi();
                transaction.rpush(`comment_${event_id}`, JSON.stringify(payload));
                transaction.sadd(`comments`, `comment_${event_id}`);
                await transaction.exec((err, replies) => {
                    if (err) {
                        this.server.emit('commentError', { message: 'Could not cast comment.' });
                        return;
                    }
                    this.server.emit('return', { message: message, event_id: event_id, username: username });
                });
            } catch (err) {
                console.log(err)
            }
        }
    }
}