import { Body, Controller, Delete, Get, Post, Query } from "@nestjs/common";
import { EventService } from "./event.service";
import { ApiBody, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateEventDto } from "./dto/createEvent.dto";
import { Evento } from "src/schemas/event.schema";
import { InjectModel } from "@nestjs/mongoose";
import { CheckDocument, CheckSess } from "src/schemas/check.schema";
import { ClientSession, Model } from "mongoose";


@ApiTags('Events')
@Controller('event')
export class EventController {
    constructor(
        private eventService: EventService,
        @InjectModel(CheckSess.name) private checkModel: Model<CheckDocument>
    ) { }


    @Post('/create-check-field')
    async create() {
        return await this.checkModel.create({ vote: 0 });
    }

    @Get('/check-t1')
    async workFirstTransaction() {
        const session: ClientSession = await this.checkModel.db.startSession();
        session.startTransaction();
        for (let i = 0; i < 1000000; i++) {
            await this.checkModel.updateOne({ _id: "66d80b2aff078eb2878bf735" }, { vote: i })
        }
        await session.commitTransaction();
        await session.endSession();
        return "over"
    }

    @Get('/check-t2')
    async workNextTransaction() {
        const session: ClientSession = await this.checkModel.db.startSession();
        session.startTransaction();
        const value = await this.checkModel.find({ _id: "66d80b2aff078eb2878bf735" })
        await session.commitTransaction();
        await session.endSession();
        return value
    }


    @Get()
    async getEvents() {
        const events = await this.eventService.getsEvents();
        return events
    }

    @Get("/comments")
    @ApiQuery({ name: 'id' })
    async getComments(@Query('id') id: string) {
        const event = await this.eventService.getsComments(id);
        return event
    }

    @Post()
    @ApiBody({ type: CreateEventDto })
    async createEvent(@Body() createEventDto: CreateEventDto): Promise<Evento> {
        const event = await this.eventService.createEvent(createEventDto);
        const evnts: Evento = event[0];
        return evnts
    }

    @Delete()
    @ApiQuery({ name: 'id' })
    async deleteEvent(@Query('id') id: string): Promise<string> {
        return id
    }
}
