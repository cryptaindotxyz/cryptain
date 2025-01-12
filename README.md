# cryptain.xyz

An advanced algorithmic trading system for Solana tokens with community-driven signals, automated execution, and profit distribution.

## System Architecture

### Core Components

1. **Trading Engine**
   - `TradingAgent`: Core trading logic and position management
   - `SignalProcessor`: Processes and validates trading signals
   - `SignalGenerator`: Generates trading signals from community activity

2. **Analysis Components**
   - `OnChainAnalyzer`: Analyzes on-chain metrics and token data
   - `SentimentAnalyzer`: Analyzes social sentiment and trends
   - `VolumeAnalyzer`: Analyzes trading volume patterns
   - `MarketMaker`: Analyzes market depth and liquidity
   - `LogAnalyzer`: Analyzes community voting patterns

3. **Risk Management**
   - `RiskManager`: Manages trading risk and exposure
   - `PositionManager`: Manages trading positions and portfolio
   - `ProfitCalculator`: Calculates trading profits
   - `ProfitDistributor`: Distributes profits to stakers

4. **Execution Components**
   - `TradeExecutor`: Executes trades via Jupiter
   - `LiquidityRouter`: Routes trades for optimal execution
   - `JupiterTradeExecutor`: Handles Jupiter DEX integration

### Database Structure

1. **Stakes Table**
   - Tracks user staking activity
   - Records stake amounts and timestamps
   - Manages stake/unstake operations

2. **Votes Table**
   - Records community votes
   - Tracks voting power and token analysis
   - Stores vote timestamps and metrics

3. **System Logs**
   - Records system activity and analysis
   - Stores trading signals and execution logs
   - Tracks profit distribution events

## Setup Instructions

1. **Environment Setup**
   ```bash
   # Clone repository
   git clone [repository-url]
   cd [repository-name]

   # Install dependencies
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file with:
   ```env
   VITE_SOLANA_RPC_URL="[your-rpc-url]"
   VITE_SOLANA_WS_URL="[your-ws-url]"
   VITE_TOKEN_MINT_ADDRESS="[token-address]"
   VITE_PAYMENT_ADDRESS="[payment-address]"
   VITE_TOKEN_DECIMALS="6"
   UNSTAKE_WALLET_PRIVATE_KEY="[wallet-key]"
   MORALIS_API_KEY="[moralis-key]"
   ```

3. **Database Setup**
   ```bash
   # Initialize database
   node src/server/db/init.js
   ```

4. **Start Services**
   ```bash
   # Start server
   npm run server

   # Start development server
   npm run dev
   ```

## Key Features

### Trading System
- Automated signal generation from community votes
- Multi-factor analysis (on-chain, sentiment, volume)
- Advanced risk management and position sizing
- Automated trade execution via Jupiter

### Risk Management
- Position limits and portfolio risk controls
- Market impact analysis and slippage protection
- Volatility and correlation analysis
- Dynamic position sizing using Kelly Criterion

### Profit Distribution
- Automated profit calculation and distribution
- Performance fee handling
- Stake-weighted distribution
- Distribution event tracking

### Community Features
- Token voting system
- Stake-based voting power
- Real-time analysis feedback
- Transparent profit sharing

## Code Structure

```
/
cryptain-agent/        # elizaOS-based agent
src/
├── server/
│   ├── services/
│   │   ├── trading/         # Trading system components
│   │   ├── profit/          # Profit distribution
│   │   └── monitoring/      # System monitoring
│   ├── db/                  # Database management
│   └── utils/               # Utility functions
├── components/              # React components
├── hooks/                   # React hooks
├── pages/                   # React pages
├── utils/                   # Frontend utilities
└── styles/                  # Global styles
```

## Security Considerations

1. **Private Keys**
   - Store securely in environment variables
   - Never expose in logs or client-side code
   - Regular key rotation recommended

2. **Transaction Security**
   - Multiple signature validation
   - Slippage protection
   - Transaction confirmation checks

3. **Access Control**
   - Role-based permissions
   - Stake-based voting power
   - Rate limiting on critical operations

## Monitoring and Maintenance

1. **System Monitoring**
   - Trading activity logs
   - Error tracking and alerts
   - Performance metrics

2. **Regular Maintenance**
   - Database backups
   - Performance optimization
   - Security updates

3. **Emergency Procedures**
   - Trading halt mechanism
   - Emergency fund recovery
   - Incident response plan
