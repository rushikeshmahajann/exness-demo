import { Router } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import 'dotenv/config';
const pool = new Pool({
    connectionString: `postgres://exness_clone:${process.env.POSTGRES_PASSWORD}@localhost:5433/trading`
});
const router = Router();
const port = 3001;
router.use(cors());
router.get('/candles', async (req, res) => {
    const { symbol, interval, start_time, end_time } = req.query;
    if (!symbol || !interval || !start_time || !end_time) {
        return res.status(400).json({
            error: "Missing required query parameters: symbol, interval, start_time, end_time"
        });
    }
    let table;
    switch (interval) {
        case '1m':
            table = "candles_1m";
            break;
        case '3m':
            table = "candles_3m";
            break;
        case '5m':
            table = "candles_5m";
            break;
        case '10m':
            table = "candles_10m";
            break;
        case '15m':
            table = 'candles_15m';
            break;
        case '30m':
            table = 'candles_30m';
            break;
        default:
            return res.status(400).json({
                error: `Unsupported Interval: ${interval} (Supported intervals are 1m, 3m, 5m, 10m, 15m, 30m)`
            });
    }
    try {
        const query = `
        SELECT
        EXTRACT(EPOCH FROM bucket) AS time,
        open,
        high,
        low,
        close
      FROM ${table}
      WHERE symbol = $1
      AND bucket >= to_timestamp($2)
      AND bucket <= to_timestamp($3)
      ORDER BY bucket ASC;
        `;
        const result = await pool.query(query, [symbol, Number(start_time), Number(end_time)]);
        const formattedData = result.rows.map(row => ({
            time: row.time,
            open: parseFloat(row.open),
            high: parseFloat(row.high),
            low: parseFloat(row.low),
            close: parseFloat(row.close),
        }));
        res.json(formattedData);
    }
    catch (error) {
        console.error('Error fetching candle data:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
export default router;
