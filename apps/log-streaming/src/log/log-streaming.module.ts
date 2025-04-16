import { Module } from "@nestjs/common";
import { LogStreamingController } from "./log-streaming.controller";
import { LogStreamingService } from "./log-streaming.service";
import { LogGateway } from "../websocket-gateway/log.gateway";

@Module({
  imports: [],
  controllers: [LogStreamingController],
  providers: [LogStreamingService, LogGateway],
})
export class LogStreamingModule {}
