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
  private static logStream: fs.WriteStream | null = null;
  private static readonly LOG_FILE = "./output.log";
  private static readonly MAX_LOG_SIZE = 100 * 1024 * 1024; // 100MB max file size
  private static currentLogSize = 0;
  private static initialized = false; // 🔥 ADD THIS FLAG

  // 🔥 ADD THIS CLEANUP METHOD
  private static initializeLogService(): void {
    if (this.initialized) return;

    try {
      const logFiles = ["./output.log", "./output.log.1"];

      // Delete existing log files
      for (const logFile of logFiles) {
        if (fs.existsSync(logFile)) {
          fs.unlinkSync(logFile);
          console.log(`Deleted existing log file: ${logFile}`);
        }
      }

      // Create new empty output.log file
      fs.writeFileSync("./output.log", "");
      console.log("Created new empty output.log file");

      this.initialized = true;
    } catch (error: any) {
      console.error("Error cleaning up log files:", error.message);
      this.initialized = true; // Set to true even if cleanup fails
    }
  }

  private static getLogStream(): fs.WriteStream {
    // 🔥 ADD THIS LINE - Initialize on first use
    //this.initializeLogService();

    if (!this.logStream || this.logStream.destroyed) {
      // Check if log file exists and get its size
      if (fs.existsSync(this.LOG_FILE)) {
        const stats = fs.statSync(this.LOG_FILE);
        this.currentLogSize = stats.size;

        // If file is too large, truncate it instead of rotating
        if (this.currentLogSize > this.MAX_LOG_SIZE) {
          fs.truncateSync(this.LOG_FILE, 0);
          this.currentLogSize = 0;
        }
      }

      this.logStream = fs.createWriteStream(this.LOG_FILE, { flags: "a" });

      // Handle stream errors
      this.logStream.on("error", (error) => {
        console.error("Log stream error:", error);
      });
    }
    return this.logStream;
  }

  public static log(...messages: any[]) {
    this.logStructured("INFO", "SYSTEM", messages.join(" "));
  }

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

      const stream = this.getLogStream();
      stream.write(logMessage);
      this.currentLogSize += Buffer.byteLength(logMessage, "utf8");

      // Check if we need to truncate the log file
      if (this.currentLogSize > this.MAX_LOG_SIZE) {
        this.truncateLogFile();
      }

      // Also log to console in debug mode
      if (process.env["MODE"] === "DEBUG") {
        process.stdout.write(logMessage);
      }
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  private static formatLogEntry(entry: LogEntry): string {
    const baseLog = `${entry.timestamp} [${entry.level}] [${entry.category}] ${entry.message}`;

    // Simply ignore the data parameter - no JSON logging
    return `${baseLog}\n`;
  }

  private static truncateLogFile() {
    try {
      if (this.logStream) {
        this.logStream.end();
        this.logStream = null;
      }

      // Keep only the last 50% of the file
      const content = fs.readFileSync(this.LOG_FILE, "utf8");
      const lines = content.split("\n");
      const keepLines = lines.slice(-Math.floor(lines.length / 2));

      fs.writeFileSync(this.LOG_FILE, keepLines.join("\n"));
      this.currentLogSize = Buffer.byteLength(keepLines.join("\n"), "utf8");

      this.logStructured(
        "INFO",
        "SYSTEM",
        "Log file truncated to prevent excessive growth"
      );
    } catch (error) {
      console.error("Failed to truncate log file:", error);
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

  public static logWarning(message: string, data?: any) {
    this.logStructured("WARN", "SYSTEM", message, data);
  }

  public static async close(): Promise<void> {
    if (this.logStream && !this.logStream.destroyed) {
      return new Promise((resolve) => {
        this.logStream!.end(() => {
          this.logStream = null;
          resolve();
        });
      });
    }
  }
}
