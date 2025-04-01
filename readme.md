# Trading Bot

A TypeScript-based automated trading bot for cryptocurrency markets.

## Features

- Real-time market data monitoring
- Automated trading strategy execution
- Risk management controls
- Multiple exchange support
- Configurable trading parameters
- Logging and performance tracking

## Installation

```bash
npm install
```

## Configuration

1. Create a `.env` file in the root directory
2. Add your API keys and configuration:

```env
API_KEY=your_api_key
API_SECRET=your_api_secret
EXCHANGE=binance
TRADING_PAIR=BTC/USDT
```

## Usage

Start the bot:

```bash
npm run start
```

Run in development mode:

```bash
npm run dev
```

## Trading Strategies

The bot supports multiple trading strategies that can be configured in the `config.ts` file:

- Moving Average Crossover
- RSI-based trading
- Grid trading
- Custom strategy implementation

## Safety Features

- Stop-loss protection
- Position size limits
- Maximum drawdown controls
- Emergency stop functionality

## Logging

Logs are stored in the `logs` directory with detailed information about:

- Trade executions
- Market conditions
- Error events
- Performance metrics

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Disclaimer

This trading bot is for educational purposes only. Use at your own risk. The creators are not responsible for any financial losses incurred while using this software.
