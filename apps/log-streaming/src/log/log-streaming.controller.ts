import { Controller, Get } from "@nestjs/common";
import { LogStreamingService } from "./log-streaming.service";

@Controller()
export class LogStreamingController {
  constructor(private readonly logStreamingService: LogStreamingService) {}

  @Get("trigger-log")
  getLog(): string {
    this.logStreamingService.readLogs();
    return "Log read triggered";
  }
}
