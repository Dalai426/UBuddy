import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventModule } from './modules/event/event.module';
import { RedisModule } from '@nestjs-modules/ioredis';


@Module({
  imports: [
    EventModule,
    MongooseModule.forRoot("mongodb://localhost:27017/?replicaSet=repDb"),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    })
  ],
  controllers: [],
  providers: []
})
export class AppModule { }
