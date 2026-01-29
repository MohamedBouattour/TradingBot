# Project Features & Overview

## Architecture
This project is a Monorepo managed by **Nx**, consisting of three main applications:

1.  **Trading Bot** (`apps/trading-bot`): The core service responsible for executing trading strategies, analyzing market data, and managing orders. Built with **TypeScript**.
2.  **Bot API** (`apps/bot-api`): A backend API service, likely built with **NestJS**, serving as the interface for data and control.
3.  **UI** (`apps/ui`): A frontend dashboard built with **Angular** and **SCSS** for monitoring and managing the bot.

## Core Capabilities
-   **Real-time Monitoring**: Tracks market data in real-time.
-   **Automated Execution**: Executes trades based on predefined strategies.
-   **Risk Management**: Includes stop-loss, position sizing, and maximum drawdown controls.
-   **Portfolio Management**: Tracking and managing portfolio assets (via API).
-   **Bot Control**: Remote start/stop and configuration (via API).
-   **Multi-Exchange Support**: Configurable for different exchanges (Binance mentioned in docs).

## Trading Strategies
The bot implements modular trading strategies (located in `apps/trading-bot/src/strategies`):
-   **BTC Spot**: A strategy specifically tailored for Bitcoin spot trading.
-   **MACD + SMA**: Uses Moving Average Convergence Divergence and Simple Moving Averages.
-   **RSI**: Relative Strength Index based trading.
-   **Supertrend**: Trend-following strategy using the Supertrend indicator.
-   **Trendline Breakout**: Identifies and trades on trendline breakouts.

## Technology Stack
-   **Language**: TypeScript
-   **Monorepo Tool**: Nx
-   **Frontend**: Angular, SCSS
-   **Backend**: NestJS (inferred)
-   **Database**: SQL (implied by `botdb.sql`)

## Infrastructure
-   **Docker/Deployment**: Contains `Dockerfile` and deployment scripts (`deploy/`, `run-vps.sh`).
-   **CI/CD**: Jest for testing, Husky for git hooks.
