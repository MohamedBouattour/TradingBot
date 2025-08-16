import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { BaseChartDirective } from "ng2-charts";
import { ChartConfiguration, ChartData, ChartType } from "chart.js";

@Component({
  selector: "app-pie-chart",
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <h3>{{ title }}</h3>
      <canvas
        baseChart
        [data]="pieChartData"
        [type]="pieChartType"
        [options]="pieChartOptions"
      >
      </canvas>
    </div>
  `,
  styles: [
    `
      .chart-container {
        position: relative;
        height: 100%;
        width: 100%;
      }
      h3 {
        text-align: center;
        margin-bottom: 15px;
        color: #333;
        font-size: 16px;
      }
      canvas {
        max-height: 300px !important;
      }
    `,
  ],
})
export class PieChartComponent implements OnChanges {
  @Input() title: string = "Portfolio Distribution";
  @Input() data: { name: string; value: number; absoluteValue: number }[] = [];

  public pieChartType: ChartType = "pie";
  public pieChartData: ChartData<"pie"> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#FF6B6B",
          "#4ECDC4",
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  public pieChartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const asset = this.data[index];
            return `${asset.name}: ${context.parsed.toFixed(1)}% ($${asset.absoluteValue.toFixed(2)})`;
          },
        },
      },
    },
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes["data"] && this.data.length > 0) {
      this.updateChartData();
    }
  }

  private updateChartData() {
    this.pieChartData = {
      labels: this.data.map((item) => item.name),
      datasets: [
        {
          data: this.data.map((item) => item.value),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#FF6B6B",
            "#4ECDC4",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };
  }
}
