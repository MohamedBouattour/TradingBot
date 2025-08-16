import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogsService {
  private readonly logFilePath = path.join(process.cwd(), 'output.log');
  private readonly logFilePath1 = path.join(process.cwd(), 'output.log.1');

  getLatestLogs(lines: number = 3): string[] {
    try {
      // Check if output.log.1 exists first, otherwise use output.log
      const logFile = fs.existsSync(this.logFilePath1) ? this.logFilePath1 : this.logFilePath;
      
      if (!fs.existsSync(logFile)) {
        return ['No log file found'];
      }

      const logContent = fs.readFileSync(logFile, 'utf-8');
      const logLines = logContent.split('\n').filter(line => line.trim() !== '');
      
      // Return the last N lines
      return logLines.slice(-lines);
    } catch (error:any) {
      return [`Error reading log file: ${error.message}`];
    }
  }

  getAllLogs(): string[] {
    try {
      // Check if output.log.1 exists first, otherwise use output.log
      const logFile = fs.existsSync(this.logFilePath1) ? this.logFilePath1 : this.logFilePath;
      
      if (!fs.existsSync(logFile)) {
        return ['No log file found'];
      }

      const logContent = fs.readFileSync(logFile, 'utf-8');
      return logContent.split('\n').filter(line => line.trim() !== '');
    } catch (error:any) {
      return [`Error reading log file: ${error.message}`];
    }
  }

  getLogFileInfo(): { fileName: string; exists: boolean; size?: number; lastModified?: Date } {
    const logFile1Info = {
      fileName: 'output.log.1',
      exists: fs.existsSync(this.logFilePath1),
      size: fs.existsSync(this.logFilePath1) ? fs.statSync(this.logFilePath1).size : undefined,
      lastModified: fs.existsSync(this.logFilePath1) ? fs.statSync(this.logFilePath1).mtime : undefined,
    };

    const logFileInfo = {
      fileName: 'output.log',
      exists: fs.existsSync(this.logFilePath),
      size: fs.existsSync(this.logFilePath) ? fs.statSync(this.logFilePath).size : undefined,
      lastModified: fs.existsSync(this.logFilePath) ? fs.statSync(this.logFilePath).mtime : undefined,
    };

    // Return info for the file that exists, prioritizing output.log.1
    return logFile1Info.exists ? logFile1Info : logFileInfo;
  }
}