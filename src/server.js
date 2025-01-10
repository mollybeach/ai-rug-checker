/**
 * @title Server
 * @fileoverview Server
 * @path /src/server.js
 */
const express = require("express");
const cors = require("cors");
const { Eliza } = require("@elizaos/core");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Eliza
const eliza = new Eliza({
    character: require("./character.json")
});

// Example route using Eliza
app.get("/eliza", (req, res) => {
    const response = eliza.respond("check");
    res.send(response);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));