
export const timescale = `

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
  trade_time  TIMESTAMPTZ NOT NULL, -- use trade event time T (ms -> timestamptz)
  event_time  TIMESTAMPTZ,          -- event time E if you want both
  price       NUMERIC NOT NULL,
  quantity    NUMERIC NOT NULL,
  is_buyer_maker BOOLEAN NOT NULL,
  raw         JSONB,                 -- raw full payload for debugging/audit
  PRIMARY KEY (trade_id, symbol)
);

-- Convert to hypertable partitioned by symbol into 3 space partitions
-- chunk_time_interval is 1 day (tune as needed)
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

-- Enable compression on the hypertable and segment by symbol (improves compression per symbol)
ALTER TABLE trades SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol'
);

-- Add automatic compression policy: compress chunks older than 1 day
SELECT add_compression_policy('trades', INTERVAL '1 day');

-- -------------------------------
-- Continuous aggregates (candles)
-- Each view groups by symbol + bucket so it's per-symbol.
-- -------------------------------

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

-- Add continuous aggregate policies (auto-refresh)
-- - start_offset: how far back to include when refreshing (keeps historical windows refreshed)
-- - end_offset: how recent buckets are left out (to avoid finalizing very recent buckets)
-- - schedule_interval: how often the refresh runs

SELECT add_continuous_aggregate_policy(
  'candles_1m',
  start_offset => INTERVAL '1 day',
  end_offset   => INTERVAL '10 seconds',
  schedule_interval => INTERVAL '30 seconds'
);

SELECT add_continuous_aggregate_policy(
  'candles_3m',
  start_offset => INTERVAL '1 day',
  end_offset   => INTERVAL '15 seconds',
  schedule_interval => INTERVAL '30 seconds'
);

SELECT add_continuous_aggregate_policy(
  'candles_5m',
  start_offset => INTERVAL '1 day',
  end_offset   => INTERVAL '20 seconds',
  schedule_interval => INTERVAL '1 minute'
);

SELECT add_continuous_aggregate_policy(
  'candles_10m',
  start_offset => INTERVAL '7 days',
  end_offset   => INTERVAL '30 seconds',
  schedule_interval => INTERVAL '1 minutes'
);

SELECT add_continuous_aggregate_policy(
  'candles_15m',
  start_offset => INTERVAL '7 days',
  end_offset   => INTERVAL '45 seconds',
  schedule_interval => INTERVAL '2 minutes'
);

SELECT add_continuous_aggregate_policy(
  'candles_30m',
  start_offset => INTERVAL '14 days',
  end_offset   => INTERVAL '60 seconds',
  schedule_interval => INTERVAL '3 minutes'
);

-- Optional: security / vacuum / retention policies you may want later
-- SELECT add_retention_policy('trades', INTERVAL '90 days');  -- keep last 90 days raw, if you want


`