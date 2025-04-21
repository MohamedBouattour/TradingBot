import { Injectable } from "@nestjs/common";
import { LogGateway } from "../websocket-gateway/log.gateway";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class LogStreamingService {
  constructor(private readonly logGateway: LogGateway) {}

  onModuleInit() {
    setInterval(() => this.readLogs(), 5000);
  }

  readLogs(): void {
    try {
      const logPath =
        process.env["NODE_ENV"] === "production"
          ? path.join("./", "output.log")
          : path.join(__dirname, "..", "..", "..", "..", "output.log");
      const logs = fs.readFileSync(logPath, "utf-8");
      console.log(logs);
      this.logGateway.emitLog(logs);
    } catch (err) {
      console.error("Error reading logs:", err);
    }
  }
}
