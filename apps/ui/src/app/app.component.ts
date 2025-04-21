import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { LogComponent } from "./core/components/log.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, LogComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "bot-ui";
}
