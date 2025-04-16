import { Controller, Get } from "@nestjs/common";
import { LogStreamingService } from "./log-streaming.service";

@Controller()
export class LogStreamingController {
  constructor(private readonly logStreamingService: LogStreamingService) {}

  @Get()
  hello(): string {
    return "Logs are being streamed";
  }
  @Get()
  getLog(): string {
    this.logStreamingService.readLogs();
    return "Logs are being streamed";
  }
}
