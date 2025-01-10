/**
 * @title Blockchain
 * @fileoverview Blockchain
 * @path /src/utils/blockchain.js
 */
const axios = require("axios");

const fetchCoinData = async(contractAddress) => {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${contractAddress}`);
        return response.data;
    } catch (err) {
        console.error(err);
        return null;
    }
};

module.exports = { fetchCoinData };