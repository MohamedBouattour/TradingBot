import { Component, OnInit, inject } from "@angular/core";
import { LogSocketService } from "../services/log-socket.service";
import { NgClass } from "@angular/common";
import { distinct } from "rxjs";

@Component({
  selector: "app-log",
  templateUrl: "./log.component.html",
  styleUrls: ["./log.component.scss"],
  standalone: true,
  imports: [NgClass],
})
export class LogComponent implements OnInit {
  logs: string[] = [];

  constructor() {}

  logSocketService = inject(LogSocketService);

  ngOnInit() {
    this.logSocketService
      .listenForLogs()
      .pipe(distinct())
      .subscribe((log: string) => {
        const arr = log.split("\n").filter((x) => x.length && x !== "\r");
        this.logs = arr.splice(0, arr.length - 1);
        console.log(this.logs.reverse());
      });
  }
}
