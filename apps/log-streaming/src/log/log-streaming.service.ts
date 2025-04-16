import { Injectable } from "@nestjs/common";
import { LogGateway } from "../websocket-gateway/log.gateway";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class LogStreamingService {
  constructor(private readonly logGateway: LogGateway) {}

  onModuleInit() {
    setInterval(() => this.readLogs(), 30000);
  }

  readLogs() {
    try {
      const logs = fs.readFileSync(`${path}/output.log`, "utf-8");
      console.log(logs);
      this.logGateway.emitLog(logs);
    } catch (err) {
      console.error("Error reading logs:", err);
    }
  }
}
