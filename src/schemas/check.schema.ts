import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CheckDocument = HydratedDocument<CheckSess>;

@Schema()
export class CheckSess {

    @Prop({ default: 0 })
    vote: number;

}

export const SessionCheckerSchema = SchemaFactory.createForClass(CheckSess);