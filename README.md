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
User Input (Token Address)
         ↓
    Data Collection
    /            \
Etherscan     DexScreener
    \            /
    Data Processing
         ↓
  Calculate Metrics
         ↓
   AI Risk Analysis
         ↓
  Risk Assessment
     /        \
High Risk    Low Risk
   ↓            ↓
FUD Alert    Store Data
   ↓            ↓
Social      Training
Media       Dataset
```

### Process Explanation:

1. **Input**: User submits a token address for analysis
2. **Data Collection**: System fetches data from multiple sources
3. **Processing**: Raw data is transformed into risk metrics
4. **Analysis**: AI model evaluates the risk factors
5. **Output**: Generates alerts or stores results for training

---
## 📂 Project Structure
```
rug-watch-dog/
├── .git/
├── .vscode/
├── assets/
│   └── images/
│   │   └── rug-watch-dog.png
├── characters/
│   ├── eliza.character.json
│   ├── rugwatchdog.character.json
│   ├── tate.character.json
│   └── trump.character.json
├── data/
│   ├── model/
│   │   ├── model.json
│   │   └── weights.bin
│   └── trainingData.json
├── dist/
├── node_modules/
├── scripts/
│   ├── clean.sh
│   ├── collectData.ts
│   └── trainModel.ts
├── src/
│   ├── cache/
│   │   └── index.ts
│   ├── chat/
│   │   └── index.ts
│   ├── clients/
│   │   └── index.ts
│   ├── config/
│   │   └── index.ts
│   ├── data/
│   │   ├── collector.ts
│   │   ├── fetcher.ts
│   │   ├── model.ts
│   │   ├── preprocess.ts
│   │   ├── scanner.ts
│   │   ├── storage.ts
│   │   ├── trainingData.json
│   │   └── types.ts
│   ├── database/
│   │   └── index.ts
│   ├── ml/
│   │   └── model.ts
│   ├── scripts/
│   │   └── train.ts
│   ├── training/
│   │   └── train.ts
│   ├── .DS_Store
│   ├── character.ts
│   ├── index.ts
│   └── scan.ts
├── tests/
│   └── data/
│   │   └── fetcher.test.ts
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
DEX_SCREENER_API_URL=https://api.dexscreener.com/latest/dex

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
```

## 📜 License

This project is open-sourced under the MIT License - see the LICENSE file for details.

