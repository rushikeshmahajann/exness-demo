import { Client } from "pg";
import { timescale } from "./trading-schema.js";
async function run() {
    const client = new Client({ connectionString: `postgres://exness_clone:${process.env.POSTGRES_PASSWORD}@localhost:5433/trading` });
    await client.connect();
    try {
        console.log("Running Timescale setup SQL...");
        await client.query(timescale);
        console.log('Done.');
    }
    catch (error) {
        console.error('SQL failed:', error);
    }
    finally {
        await client.end();
    }
}
run();
