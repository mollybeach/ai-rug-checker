# 🐕 Rug Watch Dog 🤖🔗

Welcome to the **Rug Watch Dog**, an advanced AI-driven platform that helps investors analyze cryptocurrency tokens, especially meme coins 🐕💰, to detect potential "rug pulls" 🛑. This project combines cutting-edge machine learning 📊, blockchain data analysis 🔗, and chatbot integration 🤝 to enhance security 🔒 in the crypto ecosystem.
Check out the live demo: [RugWatchDog](https://rugwatchdog.vercel.app/)

![Rug Watch Dog](./assets/images/rug-watch-dog.png)

## 🌟 Features

- **AI Risk Analysis**: Automatically analyze meme coins for risks like insider holding %, sniper wallet activity, and volume anomalies.
- **Blockchain Data Fetching**: Integrates with APIs (Etherscan, DexScreener) to fetch real-time token and transaction data.
- **Eliza Chatbot Integration**: Interact with a conversational AI assistant on Discord, Telegram, and Twitter for real-time insights.
- **FUD Alerts**: Automatically generate social media alerts for high-risk tokens to keep the community informed.
- **Customizable AI Models**: Train and adapt the AI to detect emerging fraud patterns in the crypto ecosystem.

## 🔄 Application Flow

```
User Request
    │
    ▼
API Layer (src/api/)
    │
    ▼
Data Collection Layer
    │
    ├─► Etherscan API
    │   (src/data-harvesting/fetcher.ts)
    │
    └─► DexScreener API
        (src/data-harvesting/fetcher.ts)
    │
    ▼
Data Processing
    │
    ├─► Token Metrics
    │   (src/data-processing/metrics.ts)
    │
    └─► Data Storage
        (src/data-processing/storage.ts)
    │
    ▼
ML Analysis
    │
    ├─► Model Prediction
    │   (src/training/predictor.ts)
    │
    └─► Risk Evaluation
        (src/training/evaluator.ts)
    │
    ▼
Response/Alerts
    │
    ├─► API Response
    │   (src/api/routes/)
    │
    └─► Social Integrations
        (src/integrations/)
```

### Process Explanation:

1. **Input**: User submits a token address for analysis
2. **Data Collection**: System fetches data from multiple sources
3. **Processing**: Raw data is transformed into risk metrics
4. **Analysis**: AI model evaluates the risk factors
5. **Output**: Generates alerts or stores results for training


For more details on each step, see the documentation below.

## 🔧 Technical Architecture

### 1. API Layer (`src/api/`)
- `routes/`: API endpoint handlers
  - `analyze.ts`: Token analysis endpoints
  - `metrics.ts`: Metrics retrieval
  - `tokens.ts`: Token management
- `middleware/`: Request processing
  - `auth.ts`: Authentication handling

### 2. Data Collection (`src/data-harvesting/`)
- `fetcher.ts`: External API integrations
- `collector.ts`: Data collection orchestration
- `chainMonitor.ts`: Blockchain scanning
- `tokenScanner.ts`: Token-specific scanning

### 3. Data Processing (`src/data-processing/`)
- `metrics.ts`: Token metrics calculation
- `parser.ts`: Raw data parsing
- `storage.ts`: Data persistence layer

### 4. Machine Learning (`src/training/`)
- `modelPredictor.ts`: Risk prediction logic
- `modelEvaluator.ts`: Model evaluation
- `modelTrainer.ts`: Model training pipeline

### 5. Database Layer (`src/db/`)
- `models/`: Database schemas
- `migrations/`: Database migrations
- `connection.ts`: Database configuration

### 6. Monitoring & Scripts (`src/scripts/`)
- `collect-data.ts`: Training data collection
- `clean-db.ts`: Database maintenance
- `train.ts`: Model training execution

### 7. Types & Utils (`src/types/`, `src/utils/`)
- `api.ts`: API interfaces
- `data.ts`: Data structure types
- `utils.ts`: Helper functions

### 8. Model Storage (`/models/`)
- `datasets/`: Training datasets
- `trained/`: Trained model files

### 9. Integration Layer
- `src/chat/index.ts`: Chat interface implementation
- `src/clients/index.ts`: Social media client integrations
- `src/cache/index.ts`: Performance optimization
---



## �� Project Structure

```
rug-watch-dog/
├── .git/
├── .vscode/
├── assets/
│   └── images/
│   │   └── rug-watch-dog.png
├── dist/
├── node_modules/
├── src/
│   ├── agents/
│   │   ├── eliza.character.json
│   │   ├── rugwatchdog.character.json
│   │   ├── tate.character.json
│   │   └── trump.character.json
│   ├── api/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── analyze.ts
│   │   │   ├── metrics.ts
│   │   │   └── tokens.ts
│   │   └── server.ts
│   ├── config/
│   │   ├── default.ts
│   │   └── index.ts
│   ├── data-harvesting/
│   │   ├── collector.ts
│   │   ├── fetcher.ts
│   │   ├── chainMonitor.ts
│   │   └── tokenScanner.ts
│   ├── data-processing/
│   │   ├── metrics.ts
│   │   ├── parser.ts
│   │   └── storage.ts
│   ├── db/
│   │   ├── migrations/
│   │   ├── models/
│   │   │   └── Token.ts
│   │   ├── seeders/
│   │   └── connection.ts
│   ├── integrations/
│   ├── models/
│   │   ├── datasets/
│   │   │   └── training.json
│   │   └── trained/
│   │       ├── model.json
│   │       └── weights.bin
│   ├── monitor/
│   │   └── collector.ts
│   ├── scripts/
│   │   ├── clean-db.ts
│   │   ├── collect-data.ts
│   │   └── train.ts
│   ├── tests/
│   │   ├── api/
│   │   │   └── routes/
│   │   │         └── tokens.test.ts
│   │   ├── db/
│   │   └── services/
│   │       └── ml/
│   │             └── predictor.test.ts
│   ├── training/
│   │   ├── modelEvaluator.ts
│   │   ├── modelPredictor.ts
│   │   └── modelTrainer.ts
│   ├── types/
│   │   ├── api.ts
│   │   └── data.ts
│   ├── utils/
│   │   └── utils.ts
│   └── index.ts
├── .DS_Store
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── jest.config.ts
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```
---

## 🛠️ Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mollybeach/rug-watch-dog.git
cd rug-watch-dog
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
# Required API Keys
ETHERSCAN_API_KEY=your_etherscan_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/your_alchemy_api_key

# Discord Integration (Optional)
DISCORD_APPLICATION_ID=your_discord_app_id
DISCORD_API_TOKEN=your_discord_bot_token

# OpenRouter AI (Optional)
OPENROUTER_API_KEY=your_openrouter_key

# Twitter Bot Integration (Optional)
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email

# API URLs
ETHERSCAN_API_URL=https://api.etherscan.io/api
DEX_SCREENER_API_URL=https://api.dexscreener.com/latest/
ALCHEMY_API_URL=https://eth-mainnet.g.alchemy.com/v2/

# Server Configuration
PORT=3000
NODE_ENV=development
```

Note: DexScreener API does not require an API key but has a rate limit of 300 requests per minute.

### 4. Quick Commands
- Use ⌘K to generate a command
- Common commands:
  ```bash
  pnpm start        # Start the server
  pnpm train        # Train the model
  pnpm collect-data # Collect training data
  pnpm test         # Run tests
  ```

## 🔧 Troubleshooting

### Common TypeScript Errors

1. **Property Missing Error**
```typescript
Property 'marketCap' does not exist on type '{ volumeAnomaly: boolean; holderConcentration: boolean; liquidityScore: boolean; }'
```
Fix: Ensure your interfaces match the data structure:
```typescript
interface TokenMetrics {
  volume: number;
  holders: number;
  liquidity: number;
  priceChange24h: number;
  buyTxns24h: number;
  sellTxns24h: number;
  marketCap: number;
}
```

2. **Training Data Type Mismatch**
```typescript
Argument of type '{ volumeAnomaly: number; holderConcentration: number; liquidityScore: number; isRugPull: boolean; }[]' is not assignable to parameter of type 'TrainingData[]'
```
Fix: Make sure your training data includes all required fields:
```typescript
interface TrainingData {
  volumeAnomaly: number;
  holderConcentration: number;
  liquidityScore: number;
  priceVolatility: number;
  sellPressure: number;
  marketCapRisk: number;
  isRugPull: boolean;
}
```

## 📊 Model Training

The model is trained on a diverse dataset including:
- 15 known rug pull tokens (including SQUID, SAFEMOON, LUNA Classic)
- 15 legitimate tokens (including WETH, USDC, UNI)

Training data is collected from:
- Etherscan (holder data, contract info)
- DexScreener (price, volume, liquidity data)

## 🚀 Usage

1. Analyze a token:
```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"tokenAddress":"0x..."}'
```

2. Train with new data:
```bash
pnpm collect-data
pnpm train
```

## 📜 License

This project is open-sourced under the MIT License - see the LICENSE file for details.

