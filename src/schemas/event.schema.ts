import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Evento {

    @Prop()
    name: string;

    @Prop()
    comments: any[];

    @Prop({ default: 0 })
    vote: number;
}

export const EventSchema = SchemaFactory.createForClass(Event);