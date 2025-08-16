import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import "reflect-metadata";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for cross-origin requests
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Serve static files from UI directory
  const uiPath = join(process.cwd(), 'ui', 'browser');
  app.use(express.static(uiPath));

  // Global prefix for API routes only
  app.setGlobalPrefix('api');

  // Fallback for Angular routing - serve index.html for non-API routes
  app.use((req:any, res:any, next:any) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(join(uiPath, 'index.html'));
  });

  const port = process.env['PORT'] ?? 3002;
  await app.listen(port);
  
  console.log(`Bot API is running on: http://localhost:${port}/api`);
  console.log(`Bot UI is available at: http://localhost:${port}/`);
}
bootstrap();
