import * as fs from "fs";
const logStream = fs.createWriteStream("./output.log", { flags: "a" });

export class LogService {
  public static log(...messages: any[]) {
    logStream.write(`${messages}\n`);
    process.stdout.write(`${messages}\n`);
  }
}
