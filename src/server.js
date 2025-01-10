/**
 * @title Server
 * @fileoverview Server
 * @path /src/server.js
 */
const { fetchCoinData } = require("./utils/blockchain");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("AI Rug Checker API is running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/coin/:address", async(req, res) => {
    const data = await fetchCoinData(req.params.address);
    res.json(data);
});