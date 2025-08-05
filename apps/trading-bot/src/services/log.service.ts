import * as fs from "fs";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  category:
    | "SYSTEM"
    | "TRADING"
    | "REBALANCE"
    | "MEMORY"
    | "ASSET"
    | "DECISION";
  message: string;
  data?: any;
}

export class LogService {
  private static readonly LOG_FILE = "./output.log";
  private static readonly MAX_LOG_SIZE = 100 * 1024 * 1024; // 100MB

  public static logStructured(
    level: "INFO" | "WARN" | "ERROR" | "DEBUG",
    category:
      | "SYSTEM"
      | "TRADING"
      | "REBALANCE"
      | "MEMORY"
      | "ASSET"
      | "DECISION",
    message: string,
    data?: any
  ) {
    try {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        message,
        data,
      };

      const logMessage = this.formatLogEntry(logEntry);

      // Simple file append
      fs.appendFileSync(this.LOG_FILE, logMessage);

      // Check file size and truncate if needed
      this.checkFileSize();

      // Console output in debug mode
      if (process.env["MODE"] === "DEBUG") {
        process.stdout.write(logMessage);
      }
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  private static formatLogEntry(entry: LogEntry): string {
    let logLine = `${entry.timestamp} [${entry.level}] [${entry.category}] ${entry.message}`;

    if (entry.data) {
      logLine += ` | Data: ${JSON.stringify(entry.data)}`;
    }

    return `${logLine}\n`;
  }

  private static checkFileSize() {
    try {
      if (fs.existsSync(this.LOG_FILE)) {
        const stats = fs.statSync(this.LOG_FILE);
        if (stats.size > this.MAX_LOG_SIZE) {
          const content = fs.readFileSync(this.LOG_FILE, "utf8");
          const lines = content.split("\n");
          const keepLines = lines.slice(-Math.floor(lines.length / 2));
          fs.writeFileSync(this.LOG_FILE, keepLines.join("\n"));
        }
      }
    } catch (error) {
      console.error("Failed to manage log file size:", error);
    }
  }

  // Convenience methods for different log types
  public static logTradingDecision(message: string, data?: any) {
    this.logStructured("INFO", "DECISION", message, data);
  }

  public static logAssetValue(message: string, data?: any) {
    this.logStructured("INFO", "ASSET", message, data);
  }

  public static logRebalance(message: string, data?: any) {
    this.logStructured("INFO", "REBALANCE", message, data);
  }

  public static logMemoryStats(message: string, data?: any) {
    this.logStructured("INFO", "MEMORY", message, data);
  }

  public static logError(message: string, data?: any) {
    this.logStructured("ERROR", "SYSTEM", message, data);
  }
}
