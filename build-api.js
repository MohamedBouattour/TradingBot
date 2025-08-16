// build-api.js
require("esbuild")
  .build({
    entryPoints: ["./apps/bot-api/src/main.ts"],
    bundle: true,
    platform: "node",
    outfile: "dist/bot-api.js",
    external: [
      // Validation
      "class-transformer",
      "class-validator",

      // Databases
      "kafkajs",
      "ioredis",
      "mysql2",
      "typeorm",

      // Microservices
      "amqplib",
      "mqtt",
      "amqp-connection-manager",
      "nats",
      "@grpc/grpc-js",
      "@grpc/proto-loader",

      // NestJS Core (must be excluded to preserve DI)
      "@nestjs/common",
      "@nestjs/core",
      "@nestjs/microservices",
      "@nestjs/websockets",
      "@nestjs/platform-express",
      "@nestjs/config",
      "@nestjs/typeorm",

      // Reflection
      "reflect-metadata",
    ],
  })
  .catch(() => process.exit(1));
