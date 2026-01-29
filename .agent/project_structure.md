# Project Structure Roadmap

## Root Directory
-   `nx.json`: Nx workspace configuration.
-   `package.json`: Project dependencies and scripts.
-   `botdb.sql`: Database initialization script.
-   `.env`: Environment configuration (API keys, etc.).

## Apps

### `apps/trading-bot` (Core Logic)
-   `src/app.ts`: Main entry point.
-   `src/strategies/`: Directory containing strategy implementations.
    -   `strategy-manager.ts`: Manages active strategies.
-   `src/models/`: Data models.
-   `src/services/`: Services for data fetching and execution.

### `apps/bot-api` (Backend API)
-   `src/main.ts`: Entry point.
-   `src/app.module.ts`: Main module definition.

### `apps/ui` (Frontend Dashboard)
-   `src/main.ts`: Entry point.
-   `src/app/`: Angular components and modules.
-   `src/styles.scss`: Global styles.

## Documentation
-   `DEPLOYMENT_GUIDE.md`: How to deploy.
-   `INTEGRATION_GUIDE.md`: System integration details.
-   `LINUX_SETUP.md`: Setup instructions for Linux environments.
-   `MEMORY_OPTIMIZATION_REPORT.md`: Performance notes.
