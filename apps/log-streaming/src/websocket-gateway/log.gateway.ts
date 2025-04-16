// src/log.gateway.ts
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({ cors: true })
export class LogGateway {
  @WebSocketServer()
  server!: Server;

  emitLog(log: string) {
    this.server.emit("log_update", log);
  }
}
