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
├── characters/
│   ├── eliza.character.json
│   ├── rugwatchdog.character.json
│   ├── tate.character.json
│   └── trump.character.json
├── content_cache/
├── data/
│   └── db.sqlite
├── dist/
├── node_modules/
├── scripts/
│   └── clean.sh
├── src/
│   ├── cache/
│   │   └── index.ts
│   ├── chat/
│   │   └── index.ts
│   ├── clients/
│   │   └── index.ts
│   ├── config/
│   │   └── index.ts
│   ├── database/
│   │   └── index.ts
│   ├── character.ts
│   └── index.ts
├── .DS_Store
├── .gitignore
├── Dockerfile
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

- Copy .env.example to .env: 

```
cp .env.example .env
```
Update the following:

```
-DISCORD_APPLICATION_ID=
-DISCORD_API_TOKEN= # Bot token
+DISCORD_APPLICATION_ID="000000772361146438"
+DISCORD_API_TOKEN="OTk1MTU1NzcyMzYxMT000000.000000.00000000000000000000000000000000"
-OPENROUTER_API_KEY=
+OPENROUTER_API_KEY="sk-xx-xx-xxx"
-TWITTER_USERNAME= # Account username
-TWITTER_PASSWORD= # Account password
-TWITTER_EMAIL= # Account email
+TWITTER_USERNAME="username"
+TWITTER_PASSWORD="password"
+TWITTER_EMAIL="your@email.com"
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
