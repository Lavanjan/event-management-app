import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventTemplatesController } from './event-templates.controller';
import { EventTemplatesService } from './event-templates.service';
import { Event, EventTemplate } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventTemplate]), AuthModule],
  controllers: [EventsController, EventTemplatesController],
  providers: [EventsService, EventTemplatesService],
  exports: [EventsService, EventTemplatesService],
})
export class EventsModule {}
