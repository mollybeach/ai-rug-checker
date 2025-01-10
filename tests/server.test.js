/**
 * @title Server Test
 * @fileoverview Server test
 * @path /tests/server.test.js
 */
const request = require("supertest");
const app = require("../src/server");

describe("GET /", () => {
    it("should return API status", async() => {
        const res = await request(app).get("/");
        expect(res.text).toEqual("AI Rug Checker API is running");
    });
});