# 🐕 Rug Watch Dog 🤖🔗

Welcome to the **Rug Watch Dog**, an advanced AI-driven platform that helps investors analyze cryptocurrency tokens, especially meme coins 🐕💰, to detect potential "rug pulls" 🛑. This project combines cutting-edge machine learning 📊, blockchain data analysis 🔗, and chatbot integration 🤝 to enhance security 🔒 in the crypto ecosystem.
![Rug Watch Dog](./assets/images/rug-watch-dog.png)

---

## 🌟 Features

- **AI Risk Analysis**: Automatically analyze meme coins for risks like insider holding %, sniper wallet activity, and volume anomalies.
- **Blockchain Data Fetching**: Integrates with APIs (Etherscan, CoinGecko, Moralis) to fetch real-time token and transaction data.
- **Eliza Chatbot Integration**: Interact with a conversational AI assistant on Discord, Telegram, and Twitter for real-time insights.
- **FUD Alerts**: Automatically generate social media alerts for high-risk tokens to keep the community informed.
- **Customizable AI Models**: Train and adapt the AI to detect emerging fraud patterns in the crypto ecosystem.
- **Character Integration**: Modify or add characters using JSON files for dynamic responses and specific use cases.
- **Custom Plugins**: Extend functionality with plugins tailored to your needs.
- **Client Support**: Interact via supported clients like Twitter, Discord, or custom APIs.


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
│   └── model/
│   │   ├── model.json
│   │   └── weights.bin
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
│   │   ├── fetcher.ts
│   │   ├── model.ts
│   │   ├── preprocess.ts
│   │   └── trainingData.json
│   ├── database/
│   │   └── index.ts
│   ├── ml/
│   │   └── model.ts
│   ├── character.ts
│   └── index.ts
├── tests/
│   └── data/
│   │   └── fetcher.test.ts
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

### Step 1: Install Dependencies

Ensure **Node.js** version 22 or later is installed.

Run:

```bash
pnpm install
```

### 2. Set Up Environment Variables

- Copy `.env.example` to `.env` and update with your actual credentials:

```bash
cp .env.example .env
```

Required API keys:
- Get Etherscan API key from https://etherscan.io/apis

Note: DexScreener API doesn't require an API key but has rate limits (300 requests/minute for most endpoints).

Update the following in your `.env` file:
```env
# API Keys for Data Collection
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Discord Integration
DISCORD_APPLICATION_ID=your_discord_app_id
DISCORD_API_TOKEN=your_discord_bot_token

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_key

# Twitter Bot Integration
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email

# Optional API Settings
COINGECKO_API_URL=https://api.coingecko.com/api/v3
ETHERSCAN_API_URL=https://api.etherscan.io/api
DEX_SCREENER_API_URL=https://api.dexscreener.com/latest/dex

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Step 3: Edit Character Files
Modify the src/character.ts or add new characters in the characters/ folder. Example configuration:

``` json
{
  "name": "Eliza",
  "plugins": [],
  "clients": ["DISCORD", "TWITTER"],
  "modelProvider": "openrouter",
  "settings": {
    "secrets": {},
    "voice": {
      "model": "en_US-hfc_female-medium"
    }
  }
}
```

### Step 4: Build and Start
Start the agent:
```
pnpm start
```
### Customization 

### Add or Modify Characters
Place character JSON files in the characters/ folder. Load them using:
```
pnpm start --characters="path/to/character.json"
```
Multiple characters can be loaded by separating file paths with commas.

#### Add Clients
Edit src/character.ts to include supported clients:

```diff
- clients: [],
+ clients: [Clients.TWITTER, Clients.DISCORD],
```

#### Scripts
Scripts
Clean Script
Run the clean script to remove node_modules and build artifacts:

```bash
pnpm run clean
```
___

#### Additional Development Tools
- Testing: Configure Jest for integration and unit tests.
- Database: SQLite and PostgreSQL adapters supported.
___

## 🎯 Usage

### 1. Token Analysis:
Submit a token address to the /coin/:address endpoint to get risk analysis data.

### 2. Chatbot Commands:
Use the Eliza chatbot to interact and analyze tokens on platforms like Discord or Twitter.

### 3. Risk Alerts:
Automatically receive alerts for high-risk tokens.

---

## 🚀 Roadmap

- [ ] Add more AI models for risk analysis
- [ ] Integrate with more social media platforms
- [ ] Add more features like price prediction, trading signals, etc.
- [ ] Add more tests and improve code quality
- [ ] Add more documentation and examples

---

## 🧪 Testing

```
pnpm test
```

---

## 📜 License

This project is open-sourced under the MIT License - see the LICENSE file for details.

---
