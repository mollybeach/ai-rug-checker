# ai-rug-checker

# 🚀 AI Rug Checker 🤖🔗

Welcome to the **AI Rug Checker**, an advanced AI-driven platform that helps investors analyze cryptocurrency tokens, especially meme coins 🐕💰, to detect potential "rug pulls" 🛑. This project combines cutting-edge machine learning 📊, blockchain data analysis 🔗, and chatbot integration 🤝 to enhance security 🔒 in the crypto ecosystem.

---

## 🌟 Features

- **AI Risk Analysis**: Automatically analyze meme coins for risks like insider holding %, sniper wallet activity, and volume anomalies.
- **Blockchain Data Fetching**: Integrates with APIs (Etherscan, CoinGecko, Moralis) to fetch real-time token and transaction data.
- **Eliza Chatbot Integration**: Interact with a conversational AI assistant on Discord, Telegram, and Twitter for real-time insights.
- **FUD Alerts**: Automatically generate social media alerts for high-risk tokens to keep the community informed.
- **Customizable AI Models**: Train and adapt the AI to detect emerging fraud patterns in the crypto ecosystem.

---

## 📂 Project Structure

```
ai-rug-checker/
├── src/
│   ├── server.js          # Backend server
│   ├── character.json     # Eliza configuration
│   ├── ai/
│   │   └── model.py       # AI model training
│   └── utils/
│       └── blockchain.js  # Fetch and process blockchain data
├── config/
│   ├── .env               # Environment variables
│   └── api-config.js      # API configuration
├── tests/
│   ├── server.test.js     # Test cases
├── README.md
├── package.json
├── requirements.txt       # Python dependencies
├── .gitignore

```


---

## 🛠️ Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-rug-checker.git
cd ai-rug-checker
```

### 2. Install Dependencies
```bash
npm install
```

AI/ML (Python)
```
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
```
### 3. Set Up Environment Variables

- Copy .env.example to .env: 

```
cp .env.example .env
```
- Add your API keys (e.g., Etherscan, CoinGecko) and other configurations.

### 4. Run the Server

```
npm start
```

### 5. Run Eliza Chatbot
```
pnpm start --characters="src/character.json"
```

---

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
npm test
```

---

## 📜 License

This project is open-sourced under the MIT License - see the LICENSE file for details.

---

