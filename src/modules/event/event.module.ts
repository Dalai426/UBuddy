import { Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventSchema } from 'src/schemas/event.schema';
import { CheckSess, SessionCheckerSchema } from 'src/schemas/check.schema';


@Module({
    providers: [EventGateway, EventService],
    imports: [
        MongooseModule.forFeature([
            {
                name: Event.name,
                schema: EventSchema
            },
            {
                name: CheckSess.name,
                schema: SessionCheckerSchema
            }
        ])
    ],
    controllers: [EventController]
})
export class EventModule { }