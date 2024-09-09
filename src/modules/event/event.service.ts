import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventGateway } from './event.gateway';
import { CreateEventDto } from './dto/createEvent.dto';


@Injectable()
export class EventService {

    constructor(
        @InjectModel(Event.name) private eventModel: Model<Event>,
        private readonly eventGateway: EventGateway,
    ) { }

    async createEvent(event: CreateEventDto) {
        const newEvent = new this.eventModel(event);
        return newEvent.save();
    }
    async getsEvents() {

        const events = await this.eventModel.find().select("-comments");
        const mapped = await Promise.all(events.map(async (e: any) => {
            const votes = await this.eventGateway.getVotesFromRedis(e._id);
            if (votes) {
                e.vote = votes;
            }
            return e
        }));
        return mapped;
    }
    async getsComments(id: string) {
        return this.eventModel.findById(id).select("comments");
    }
}