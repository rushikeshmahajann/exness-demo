import { Redis } from 'ioredis';
import { Pool } from 'pg';
import 'dotenv/config';
// Initialize Redis and PostgreSQL connections
const redis = new Redis('redis://localhost:6379');
const pool = new Pool({ connectionString: `postgres://exness_clone:${process.env.POSTGRES_PASSWORD}@localhost:5433/trading` });
// Batching configuration
const BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 1000;
// Buffer to hold trades before flushing, typed as requested
let buffer = [];
let isFlushing = false;
/**
 * Flushes the current buffer of trades to the PostgreSQL database.
 * This function is designed to be called by a periodic timer.
 */
async function flushBuffer() {
    if (buffer.length === 0 || isFlushing) {
        return;
    }
    // Set the flushing flag to prevent concurrent flushes
    isFlushing = true;
    // Get the current buffer and reset it immediately to allow the main loop to continue
    const bufferToFlush = buffer;
    buffer = [];
    const client = await pool.connect();
    try {
        // Construct a single multi-row INSERT statement for efficiency
        const text = `
            INSERT INTO trades (trade_id, symbol, trade_time, event_time, price, quantity, is_buyer_maker, raw)
            VALUES ${bufferToFlush.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(', ')}
            ON CONFLICT (trade_id, symbol, trade_time) DO NOTHING;
        `;
        const values = bufferToFlush.flatMap(t => [
            t.trade_id,
            t.symbol,
            t.trade_time,
            t.event_time,
            t.price,
            t.quantity,
            t.is_buyer_maker,
            t.raw_json
        ]);
        await client.query('BEGIN');
        await client.query(text, values);
        await client.query('COMMIT');
        console.log(`Inserted ${bufferToFlush.length} trades`);
    }
    catch (error) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('DB insert error. Data lost for this batch.', error);
        // Note: The buffer is intentionally not reset here to avoid an infinite loop of failed inserts.
        // The data is lost, but the worker can continue to process new data.
    }
    finally {
        client.release();
        isFlushing = false;
    }
}
/**
 * Main worker loop that listens to the Redis queue and populates the buffer.
 */
async function runWorker() {
    console.log("Batch uploader started");
    // Start a periodic timer to flush the buffer
    setInterval(() => {
        flushBuffer().catch(console.error);
    }, FLUSH_INTERVAL_MS);
    while (true) {
        try {
            // Block and wait for a new item on the queue
            const res = await redis.brpop('trades_queue', 1);
            if (!res) {
                // The timeout was reached, continue to the next iteration
                continue;
            }
            const payload = res[1];
            const obj = JSON.parse(payload);
            const row = {
                trade_id: Number(obj.t),
                symbol: (obj.s || obj.symbol || 'UNKNOWN'),
                trade_time: new Date(Number(obj.T)),
                event_time: obj.E ? new Date(Number(obj.E)) : null,
                price: Number(obj.p),
                quantity: Number(obj.q),
                is_buyer_maker: !!obj.m,
                raw_json: obj
            };
            // Add to the buffer, which will be flushed by the timer
            buffer.push(row);
        }
        catch (error) {
            console.error('Worker error', error);
            // Wait before trying again to avoid a tight, error-prone loop
            await new Promise(r => setTimeout(r, 500));
        }
    }
}
runWorker().catch(console.error);
