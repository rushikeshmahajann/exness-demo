import WebSocket from "ws";
const symbol = "btcusdt";
const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@trade`;
const ws = new WebSocket(wsUrl);
ws.on("open", () => {
    console.log(`Connected to Binance ${symbol} trades`);
});
ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());
    console.log("📈 Trade:", data);
});
ws.on("error", (err) => {
    console.error("Error:", err);
});
