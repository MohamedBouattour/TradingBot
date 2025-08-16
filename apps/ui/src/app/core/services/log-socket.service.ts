import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LogSocketService {
  private socket: Socket;

  constructor() {
    this.socket = io("http://localhost:3002");
    this.socket.on("connect", () => console.log("connected!"));
  }

  listenForLogs(): Observable<string> {
    return new Observable((subscriber) => {
      this.socket.on("log_update", (log: string) => {
        subscriber.next(log);
      });

      // Optional: clean up on unsubscribe
      return () => {
        this.socket.off("log_update");
      };
    });
  }
}
