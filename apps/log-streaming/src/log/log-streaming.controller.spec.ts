import { Test, TestingModule } from "@nestjs/testing";
import { LogStreamingController } from "./log-streaming.controller";
import { LogStreamingService } from "./log-streaming.service";

describe("LogStreamingController", () => {
  let logStreamingController: LogStreamingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LogStreamingController],
      providers: [LogStreamingService],
    }).compile();

    logStreamingController = app.get<LogStreamingController>(
      LogStreamingController
    );
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(logStreamingController.getLog()).toBe("Hello World!");
    });
  });
});
