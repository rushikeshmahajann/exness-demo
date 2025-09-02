import WebSocket from "ws";
import { createClient } from 'redis';
const wsUrl = `wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/solusdt@trade`;
const redis = createClient({
    url: "redis://localhost:6379",
});
redis.on("error", (err) => console.error("Redis Client Error", err));
await redis.connect();
const ws = new WebSocket(wsUrl);
ws.on("open", () => {
    console.log(`Connected to Binance trades`);
});
ws.on("message", async (msg) => {
    try {
        const payload = JSON.parse(msg.toString());
        const trade = payload.data;
        await redis.lPush("trades_queue", JSON.stringify(trade));
    }
    catch (error) {
        console.error("Failed to push trade to Redis:", error);
    }
});
ws.on("error", (err) => {
    console.error("Websocket Error:", err);
});
ws.on("close", () => {
    console.log("websocket disconnected, consider reconnect logic");
});
