import { NestFactory } from "@nestjs/core";
import { LogStreamingModule } from "./log/log-streaming.module";

async function bootstrap() {
  const app = await NestFactory.create(LogStreamingModule);
  app.enableCors();
  await app.listen(process.env["PORT"] || 3000);
}
bootstrap();
