import * as fs from "fs";

export class LogService {
  private static logStream: fs.WriteStream | null = null;
  private static isShuttingDown = false;

  private static getLogStream(): fs.WriteStream {
    if (!this.logStream || this.logStream.destroyed) {
      this.logStream = fs.createWriteStream("./output.log", { flags: "a" });
      
      // Handle stream errors
      this.logStream.on('error', (error) => {
        console.error('Log stream error:', error);
      });
    }
    return this.logStream;
  }

  public static log(...messages: any[]) {
    if (this.isShuttingDown) return;
    
    try {
      const timestamp = new Date().toISOString();
      const logMessage = `${timestamp} ${messages.join(' ')}\n`;
      
      const stream = this.getLogStream();
      stream.write(logMessage);
      
      // Also log to console in debug mode
      if (process.env["MODE"] === "DEBUG") {
        process.stdout.write(logMessage);
      }
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  public static async close(): Promise<void> {
    this.isShuttingDown = true;
    
    if (this.logStream && !this.logStream.destroyed) {
      return new Promise((resolve) => {
        this.logStream!.end(() => {
          this.logStream = null;
          resolve();
        });
      });
    }
  }

  public static async flush(): Promise<void> {
    if (this.logStream && !this.logStream.destroyed) {
      return new Promise((resolve, reject) => {
        this.logStream!.write('', (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }
}
