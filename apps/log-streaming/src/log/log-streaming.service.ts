import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { LogGateway } from "../websocket-gateway/log.gateway";
import * as path from "path";
import * as fs from "fs"; // No destructuring
import { interval, defer, Subscription, of } from "rxjs";
import { switchMap, catchError, distinct } from "rxjs/operators";

@Injectable()
export class LogStreamingService implements OnModuleInit, OnModuleDestroy {
  private logSubscription!: Subscription;

  constructor(private readonly logGateway: LogGateway) {}

  onModuleInit() {
    this.getlogs();
  }

  private getlogs(): Subscription {
    return (this.logSubscription = interval(5000)
      .pipe(
        switchMap(() =>
          defer(() => fs.promises.readFile(this.getLogPath(), "utf-8")).pipe(
            catchError((err) => {
              console.error("Error reading logs:", err);
              return of(""); // fallback to empty string if error
            })
          )
        ),
        distinct()
      )
      .subscribe((logs) => {
        if (logs) {
          this.logGateway.emitLog(logs);
        }
      }));
  }

  onModuleDestroy() {
    this.logSubscription?.unsubscribe();
  }

  private getLogPath(): string {
    return process.env["NODE_ENV"] === "production"
      ? path.join("./", "output.log")
      : path.join(__dirname, "..", "..", "..", "..", "output.log");
  }
}
