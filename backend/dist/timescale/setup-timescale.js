import { Client } from "pg";
import 'dotenv/config';
const client = new Client({ connectionString: `postgres://exness_clone:${process.env.POSTGRES_PASSWORD}@localhost:5433/trading` });
async function runSqlSections() {
    try {
        await client.connect();
        console.log("Running Timescale setup SQL...");
        // Step 1: Create the main table, hypertable, and policies
        const CREATE_TABLES_AND_POLICIES = `
            -- DROP old stuff (safe to re-run)
            DROP MATERIALIZED VIEW IF EXISTS candles_1m CASCADE;
            DROP MATERIALIZED VIEW IF EXISTS candles_3m CASCADE;
            DROP MATERIALIZED VIEW IF EXISTS candles_5m CASCADE;
            DROP MATERIALIZED VIEW IF EXISTS candles_10m CASCADE;
            DROP MATERIALIZED VIEW IF EXISTS candles_15m CASCADE;
            DROP MATERIALIZED VIEW IF EXISTS candles_30m CASCADE;
            DROP TABLE IF EXISTS trades CASCADE;

            -- Create raw trades table (store full payload too)
            CREATE TABLE trades (
              trade_id    BIGINT NOT NULL,
              symbol      TEXT    NOT NULL,
              trade_time  TIMESTAMPTZ NOT NULL,
              event_time  TIMESTAMPTZ,
              price       NUMERIC NOT NULL,
              quantity    NUMERIC NOT NULL,
              is_buyer_maker BOOLEAN NOT NULL,
              raw         JSONB,
              PRIMARY KEY (trade_id, symbol, trade_time)
            );

            -- Convert to hypertable partitioned by symbol into 3 space partitions
            SELECT create_hypertable(
              'trades',
              'trade_time',
              chunk_time_interval => INTERVAL '1 day',
              partitioning_column => 'symbol',
              number_partitions => 3
            );

            -- Add indexes for fast queries
            CREATE INDEX ON trades (symbol, trade_time DESC);
            CREATE INDEX ON trades (trade_time DESC);

            -- Enable compression on the hypertable and segment by symbol
            ALTER TABLE trades SET (
              timescaledb.compress,
              timescaledb.compress_segmentby = 'symbol'
            );

            -- Add automatic compression policy
            SELECT add_compression_policy('trades', INTERVAL '1 day');
        `;
        await client.query(CREATE_TABLES_AND_POLICIES);
        console.log('Section 1 (tables and policies) completed successfully.');
        // Step 2: Create each materialized view in its own query
        console.log('Creating continuous aggregates...');
        await client.query(`
            CREATE MATERIALIZED VIEW candles_1m
            WITH (timescaledb.continuous) AS
            SELECT
              symbol,
              time_bucket('1 minute', trade_time) AS bucket,
              first(price, trade_time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, trade_time) AS close,
              sum(quantity) AS volume
            FROM trades
            GROUP BY symbol, bucket;
        `);
        await client.query(`
            CREATE MATERIALIZED VIEW candles_3m
            WITH (timescaledb.continuous) AS
            SELECT
              symbol,
              time_bucket('3 minutes', trade_time) AS bucket,
              first(price, trade_time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, trade_time) AS close,
              sum(quantity) AS volume
            FROM trades
            GROUP BY symbol, bucket;
        `);
        await client.query(`
            CREATE MATERIALIZED VIEW candles_5m
            WITH (timescaledb.continuous) AS
            SELECT
              symbol,
              time_bucket('5 minutes', trade_time) AS bucket,
              first(price, trade_time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, trade_time) AS close,
              sum(quantity) AS volume
            FROM trades
            GROUP BY symbol, bucket;
        `);
        await client.query(`
            CREATE MATERIALIZED VIEW candles_10m
            WITH (timescaledb.continuous) AS
            SELECT
              symbol,
              time_bucket('10 minutes', trade_time) AS bucket,
              first(price, trade_time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, trade_time) AS close,
              sum(quantity) AS volume
            FROM trades
            GROUP BY symbol, bucket;
        `);
        await client.query(`
            CREATE MATERIALIZED VIEW candles_15m
            WITH (timescaledb.continuous) AS
            SELECT
              symbol,
              time_bucket('15 minutes', trade_time) AS bucket,
              first(price, trade_time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, trade_time) AS close,
              sum(quantity) AS volume
            FROM trades
            GROUP BY symbol, bucket;
        `);
        await client.query(`
            CREATE MATERIALIZED VIEW candles_30m
            WITH (timescaledb.continuous) AS
            SELECT
              symbol,
              time_bucket('30 minutes', trade_time) AS bucket,
              first(price, trade_time) AS open,
              max(price) AS high,
              min(price) AS low,
              last(price, trade_time) AS close,
              sum(quantity) AS volume
            FROM trades
            GROUP BY symbol, bucket;
        `);
        console.log('Continuous aggregates created successfully.');
        // Step 3: Add each continuous aggregate policy in its own query
        console.log('Adding continuous aggregate policies...');
        await client.query(`
            SELECT add_continuous_aggregate_policy(
              'candles_1m',
              start_offset => INTERVAL '1 day',
              end_offset   => INTERVAL '10 seconds',
              schedule_interval => INTERVAL '30 seconds'
            );
        `);
        await client.query(`
            SELECT add_continuous_aggregate_policy(
              'candles_3m',
              start_offset => INTERVAL '1 day',
              end_offset   => INTERVAL '15 seconds',
              schedule_interval => INTERVAL '30 seconds'
            );
        `);
        await client.query(`
            SELECT add_continuous_aggregate_policy(
              'candles_5m',
              start_offset => INTERVAL '1 day',
              end_offset   => INTERVAL '20 seconds',
              schedule_interval => INTERVAL '1 minute'
            );
        `);
        await client.query(`
            SELECT add_continuous_aggregate_policy(
              'candles_10m',
              start_offset => INTERVAL '7 days',
              end_offset   => INTERVAL '30 seconds',
              schedule_interval => INTERVAL '1 minutes'
            );
        `);
        await client.query(`
            SELECT add_continuous_aggregate_policy(
              'candles_15m',
              start_offset => INTERVAL '7 days',
              end_offset   => INTERVAL '45 seconds',
              schedule_interval => INTERVAL '2 minutes'
            );
        `);
        await client.query(`
            SELECT add_continuous_aggregate_policy(
              'candles_30m',
              start_offset => INTERVAL '14 days',
              end_offset   => INTERVAL '60 seconds',
              schedule_interval => INTERVAL '3 minutes'
            );
        `);
        console.log('Continuous aggregate policies added successfully.');
        console.log('Timescale setup completed successfully!');
    }
    catch (error) {
        console.error('SQL failed:', error);
    }
    finally {
        await client.end();
    }
}
runSqlSections();
