import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('latest')
  getLatestLogs(@Query('lines') lines?: string) {
    const lineCount = lines ? parseInt(lines, 10) : 3;
    const logs = this.logsService.getLatestLogs(lineCount);
    
    return {
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('all')
  getAllLogs() {
    const logs = this.logsService.getAllLogs();
    
    return {
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  getLogFileInfo() {
    const info = this.logsService.getLogFileInfo();
    
    return {
      ...info,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getLogsHealth() {
    const info = this.logsService.getLogFileInfo();
    const latestLogs = this.logsService.getLatestLogs(1);
    
    return {
      status: 'ok',
      logFileExists: info.exists,
      logFileName: info.fileName,
      hasRecentLogs: latestLogs.length > 0 && !latestLogs[0].includes('Error'),
      timestamp: new Date().toISOString(),
    };
  }
}