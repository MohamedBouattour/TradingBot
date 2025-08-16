import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
// 🔥 ADD THESE IMPORTS for Chart.js
import { Chart, registerables } from "chart.js";

// 🔥 REGISTER Chart.js components
Chart.register(...registerables);
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
