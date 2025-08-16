# Trading Bot API Integration Guide

## Overview

This integration connects the existing trading-bot with a new NestJS REST API (bot-api) to store and manage portfolio data, trading decisions, ROI calculations, and rebalancing statistics.

## Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Trading Bot   │ ──────────────► │    Bot API      │
│                 │                 │   (NestJS)      │
│ - Portfolio     │                 │                 │
│ - Trading Logic │                 │ - Portfolio     │
│ - Rebalancing   │                 │ - Trading Data  │
│ - ROI Calc      │                 │ - Statistics    │
└─────────────────┘                 └─────────────────┘
```

## Components Created

### 1. Bot API (NestJS) - `apps/bot-api/`

#### Portfolio Module
- **Endpoints:**
  - `GET /api/portfolio` - Get all portfolio items
  - `GET /api/portfolio/stats` - Get portfolio statistics
  - `GET /api/portfolio/:asset` - Get specific asset
  - `POST /api/portfolio` - Create new portfolio item
  - `PUT /api/portfolio/:asset` - Update portfolio item
  - `PUT /api/portfolio/:asset/value` - Update asset value
  - `DELETE /api/portfolio/:asset` - Remove asset

#### Trading Module
- **Endpoints:**
  - `POST /api/trading/decisions` - Store trading decisions
  - `GET /api/trading/decisions` - Get trading history
  - `GET /api/trading/decisions/latest` - Get latest decision
  - `POST /api/trading/roi` - Store ROI data
  - `GET /api/trading/roi` - Get ROI history
  - `GET /api/trading/roi/latest` - Get latest ROI
  - `POST /api/trading/rebalance` - Store rebalance results
  - `GET /api/trading/rebalance` - Get rebalance history
  - `GET /api/trading/rebalance/:asset` - Get asset rebalance history
  - `GET /api/trading/stats` - Get trading statistics
  - `GET /api/trading/health` - Health check

### 2. API Client Service - `apps/trading-bot/src/services/api-client.service.ts`

Handles communication between trading-bot and bot-api:
- Sends trading decisions
- Sends ROI data
- Sends rebalance results
- Updates portfolio values
- Error handling and timeouts

### 3. Integration Points

#### Modified Files:
1. **`apps/trading-bot/src/app.ts`**
   - Added API client import
   - Sends trading decisions to API
   - Sends ROI data to API

2. **`apps/trading-bot/src/services/binance-api.service.ts`**
   - Sends rebalance results to API
   - Updates portfolio values in API
   - Enhanced error tracking

## Configuration

### Environment Variables (`.env`)
```env
# Bot API Configuration
BOT_API_URL=http://localhost:3002/api
```

### Package.json Scripts (Consolidated)
```json
{
  "start-api": "ts-node ./apps/bot-api/src/main.ts",
  "start-api:dev": "ts-node --watch ./apps/bot-api/src/main.ts",
  "start-bot-with-api": "concurrently \"npm run start-api:dev\" \"npm run start\"",
  "build-api": "esbuild ./apps/bot-api/src/main.ts --bundle --platform=node --outfile=dist/bot-api.js"
}
```

**Note:** All dependencies are now consolidated in the main `package.json` file. The bot-api no longer has its own separate package.json.

## Data Flow

### 1. Trading Decisions
```
Trading Bot Strategy → API Client → POST /api/trading/decisions
```

### 2. ROI Calculations
```
calculateRoi() → API Client → POST /api/trading/roi
```

### 3. Portfolio Rebalancing
```
handleRebalance() → API Client → POST /api/trading/rebalance
                              → PUT /api/portfolio/:asset/value
```

## Data Models

### Portfolio Item
```typescript
{
  asset: string;
  value: number;
  pricePresision: number;
  quantityPrecision: number;
  threshold: number;
  valueInBaseCurrency?: number;
}
```

### Trading Decision
```typescript
{
  decision: string;
  currentPrice: number;
  targetPrice?: number;
  executionTimeMs: number;
  timestamp: string;
  asset: string;
  pair: string;
}
```

### ROI Data
```typescript
{
  assetValue: number;
  baseCurrencyValue: number;
  portfolioValue: number;
  totalValue: number;
  roi: number;
  pnl: number;
  initialBalance: number;
  timestamp: string;
}
```

### Rebalance Result
```typescript
{
  asset: string;
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  action?: 'BUY' | 'SELL' | 'BALANCED';
  quantity?: number;
  price?: number;
  value?: number;
  currentValue: number;
  targetValue: number;
  deviation: number;
  timestamp: string;
  error?: string;
}
```

## How to Run

### Option 1: Run Both Services Together
```bash
npm run start-bot-with-api
```

### Option 2: Run Separately
```bash
# Terminal 1 - Start Bot API (with auto-reload)
npm run start-api:dev

# Terminal 2 - Start Trading Bot
npm start
```

### Option 3: Production Mode
```bash
# Build API
npm run build-api

# Start API (Terminal 1)
node dist/bot-api.js

# Start Trading Bot (Terminal 2)
npm start
```

**Note:** All dependencies are consolidated in the main `package.json`. No separate installation is needed for the bot-api.

## API Testing

### Test Portfolio Endpoints
```bash
# Get all portfolio items
curl http://localhost:3002/api/portfolio

# Get portfolio stats
curl http://localhost:3002/api/portfolio/stats

# Get specific asset
curl http://localhost:3002/api/portfolio/ETH
```

### Test Trading Endpoints
```bash
# Get trading stats
curl http://localhost:3002/api/trading/stats

# Get latest ROI
curl http://localhost:3002/api/trading/roi/latest

# Health check
curl http://localhost:3002/api/trading/health
```

## Features

### 1. Real-time Data Storage
- All trading decisions are stored with timestamps
- ROI calculations are tracked over time
- Portfolio rebalancing results are logged

### 2. Historical Analysis
- Query trading decision history
- Analyze ROI trends
- Review rebalancing performance by asset

### 3. Statistics Dashboard
- Current portfolio status
- Trading performance metrics
- Rebalancing success rates

### 4. Error Handling
- API timeouts (5 seconds)
- Graceful failure handling
- Detailed error logging

### 5. Memory Management
- Limited data retention (1000 entries per type)
- Automatic cleanup of old data
- Efficient caching

## Benefits

1. **Data Persistence**: Trading data survives bot restarts
2. **Analytics**: Historical analysis of trading performance
3. **Monitoring**: Real-time portfolio status via API
4. **Scalability**: Separate API can be scaled independently
5. **Integration**: Easy to connect dashboards, alerts, or other services

## Next Steps

1. **Database Integration**: Replace in-memory storage with persistent database
2. **Authentication**: Add API security
3. **WebSocket**: Real-time updates for dashboards
4. **Alerts**: Notification system for important events
5. **Dashboard**: Web interface for monitoring and control