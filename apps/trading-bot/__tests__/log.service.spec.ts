import * as fs from "fs";
import { LogService } from "../src/services/log.service";

// Mock fs module
jest.mock("fs");

describe("LogService", () => {
  const mockWriteStream = {
    write: jest.fn(),
    end: jest.fn((callback?: () => void) => {
      if (callback) callback();
    }),
    destroyed: false,
    on: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 0 });
    (fs.truncateSync as jest.Mock).mockImplementation(() => {});
    (fs.readFileSync as jest.Mock).mockReturnValue("");
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
    (LogService as any).logStream = null;
    (LogService as any).currentLogSize = 0;
    (LogService as any).initialized = false;
  });

  afterEach(async () => {
    await LogService.close();
  });

  describe("log", () => {
    it("should log a simple message", () => {
      LogService.log("Test message");
      expect(fs.createWriteStream).toHaveBeenCalled();
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log multiple messages joined together", () => {
      LogService.log("Message 1", "Message 2", "Message 3");
      expect(mockWriteStream.write).toHaveBeenCalled();
      const call = mockWriteStream.write.mock.calls[0][0];
      expect(call).toContain("Message 1 Message 2 Message 3");
    });
  });

  describe("logStructured", () => {
    it("should log with INFO level", () => {
      LogService.logStructured("INFO", "SYSTEM", "Test message");
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log with ERROR level", () => {
      LogService.logStructured("ERROR", "SYSTEM", "Error message");
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log with WARN level", () => {
      LogService.logStructured("WARN", "SYSTEM", "Warning message");
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log with DEBUG level", () => {
      LogService.logStructured("DEBUG", "SYSTEM", "Debug message");
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log with data object", () => {
      const data = { key: "value", number: 123 };
      LogService.logStructured("INFO", "TRADING", "Test message", data);
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log to console in DEBUG mode", () => {
      const originalEnv = process.env["MODE"];
      process.env["MODE"] = "DEBUG";
      const consoleSpy = jest.spyOn(process.stdout, "write").mockImplementation();

      LogService.logStructured("INFO", "SYSTEM", "Debug message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
      process.env["MODE"] = originalEnv;
    });

    it("should handle write errors gracefully", () => {
      mockWriteStream.write.mockImplementation(() => {
        throw new Error("Write failed");
      });
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      LogService.logStructured("INFO", "SYSTEM", "Test message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("convenience methods", () => {
    it("should log trading decision", () => {
      LogService.logTradingDecision("Buy signal", { price: 100 });
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log asset value", () => {
      LogService.logAssetValue("BTC value", { value: 50000 });
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log rebalance", () => {
      LogService.logRebalance("Rebalancing portfolio", { asset: "BTC" });
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log memory stats", () => {
      LogService.logMemoryStats("Memory usage", { heap: 100 });
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log error", () => {
      LogService.logError("Error occurred", { error: "test" });
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it("should log warning", () => {
      LogService.logWarning("Warning message", { warning: "test" });
      expect(mockWriteStream.write).toHaveBeenCalled();
    });
  });

  describe("log file management", () => {
    it("should truncate log file when size exceeds limit", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 101 * 1024 * 1024 }); // 101MB
      (fs.readFileSync as jest.Mock).mockReturnValue("line1\nline2\nline3\nline4");
      (LogService as any).currentLogSize = 101 * 1024 * 1024;

      LogService.log("Test message");

      expect(fs.truncateSync).toHaveBeenCalled();
    });

    it("should handle stream errors", () => {
      const errorHandler = jest.fn();
      mockWriteStream.on.mockImplementation((event: string, handler: any) => {
        if (event === "error") {
          handler(new Error("Stream error"));
        }
      });

      LogService.log("Test message");

      expect(mockWriteStream.on).toHaveBeenCalledWith("error", expect.any(Function) as any);
    });
  });

  describe("close", () => {
    it("should close the log stream", async () => {
      (LogService as any).logStream = mockWriteStream;
      await LogService.close();
      expect(mockWriteStream.end).toHaveBeenCalled();
    });

    it("should handle already destroyed stream", async () => {
      mockWriteStream.destroyed = true;
      (LogService as any).logStream = mockWriteStream;
      await LogService.close();
      expect(mockWriteStream.end).not.toHaveBeenCalled();
    });

    it("should handle null stream", async () => {
      (LogService as any).logStream = null;
      await LogService.close();
      expect(mockWriteStream.end).not.toHaveBeenCalled();
    });
  });

  describe("formatLogEntry", () => {
    it("should format log entry correctly", () => {
      LogService.log("Test message");
      const call = mockWriteStream.write.mock.calls[0][0];
      expect(call).toMatch(/\[\d{2}:\d{2}:\d{2}\] Test message\n/);
    });

    it("should remove duplicate timestamps from message", () => {
      const messageWithTimestamp = "2024-01-01T12:00:00.000Z Test message";
      LogService.log(messageWithTimestamp);
      const call = mockWriteStream.write.mock.calls[0][0];
      expect(call).not.toContain("2024-01-01T12:00:00.000Z");
    });

    it("should preserve border formatting", () => {
      const borderMessage = "═".repeat(80);
      LogService.log(borderMessage);
      const call = mockWriteStream.write.mock.calls[0][0];
      expect(call).toContain("═".repeat(80));
    });
  });

  describe("createBorder", () => {
    it("should create a border with title", () => {
      const border = LogService.createBorder("TEST TITLE", 80, "═");
      expect(border).toContain("TEST TITLE");
      expect(border).toContain("═");
      expect(border.split("\n").length).toBe(3); // Top border, title line, bottom border
    });

    it("should create a border without title", () => {
      const border = LogService.createBorder("", 80, "═");
      const lines = border.split("\n");
      expect(lines[0]).toBe("═".repeat(80));
      expect(lines[1]).toBe("═".repeat(80));
      expect(lines[2]).toBe("═".repeat(80));
    });

    it("should use custom width", () => {
      const border = LogService.createBorder("TEST", 50, "═");
      const lines = border.split("\n");
      expect(lines[0].length).toBe(50);
    });

    it("should use custom character", () => {
      const border = LogService.createBorder("TEST", 80, "-");
      expect(border).toContain("-");
      expect(border).not.toContain("═");
    });
  });

  describe("createSeparator", () => {
    it("should create a separator line", () => {
      const separator = LogService.createSeparator("─", 80);
      expect(separator).toBe("─".repeat(80));
    });

    it("should use default width", () => {
      const separator = LogService.createSeparator();
      expect(separator).toBe("─".repeat(80));
    });

    it("should use custom width", () => {
      const separator = LogService.createSeparator("─", 50);
      expect(separator).toBe("─".repeat(50));
    });

    it("should use custom character", () => {
      const separator = LogService.createSeparator("=", 80);
      expect(separator).toBe("=".repeat(80));
    });
  });

  describe("truncateLogFile", () => {
    it("should truncate log file when size exceeds limit", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 101 * 1024 * 1024 });
      (fs.readFileSync as jest.Mock).mockReturnValue("line1\nline2\nline3\nline4\nline5\nline6");
      // Set currentLogSize to just below MAX_LOG_SIZE so that after writing, it exceeds
      (LogService as any).currentLogSize = 100 * 1024 * 1024 - 1000; // Just below 100MB
      (LogService as any).logStream = mockWriteStream;
      // Mock write to simulate adding bytes that push over the limit
      mockWriteStream.write.mockImplementation(() => {
        (LogService as any).currentLogSize = 101 * 1024 * 1024;
      });

      LogService.log("Test message");

      expect(fs.readFileSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should handle truncate errors gracefully", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 101 * 1024 * 1024 });
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("Read failed");
      });
      (LogService as any).currentLogSize = 101 * 1024 * 1024;
      (LogService as any).logStream = mockWriteStream;
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      LogService.log("Test message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getLogStream", () => {
    it("should handle existing log file with size check", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 50 * 1024 * 1024 });

      LogService.log("Test");

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.statSync).toHaveBeenCalled();
    });

    it("should truncate large existing log file", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 101 * 1024 * 1024 });
      (fs.truncateSync as jest.Mock).mockImplementation(() => {});

      LogService.log("Test");

      expect(fs.truncateSync).toHaveBeenCalled();
    });
  });
});


