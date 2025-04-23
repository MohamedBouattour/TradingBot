import { NestFactory } from "@nestjs/core";
import { LogStreamingModule } from "./log/log-streaming.module";
import * as path from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Response, Request } from "express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    LogStreamingModule
  );
  app.enableCors();

  // Serve static frontend files
  const frontendPath = path.join(__dirname, "..", "static", "browser");
  app.useStaticAssets(frontendPath);
  app.setBaseViewsDir(frontendPath);

  // Catch-all route: fallback to index.html
  app.use((req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });

  await app.listen(process.env["PORT"] || 3000);
}
bootstrap();
