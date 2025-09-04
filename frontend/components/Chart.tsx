"use client";
import React, { useRef, useEffect } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickSeriesOptions,
  CandlestickSeries,
} from "lightweight-charts";

interface Interval {
  id: number;
  time: string;
}

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandleChartProps {
  symbol: string,
  interval: string,
  start_time: number,
  end_time: number,
}


/* 
const intervals: Interval[] = [
  {
    id: 1,
    time: "1m",
  },
  {
    id: 2,
    time: "3m",
  },
  {
    id: 3,
    time: "5m",
  },
  {
    id: 4,
    time: "10m",
  },
  {
    id: 5,
    time: "15m",
  },
  {
    id: 6,
    time: "30m",
  },
]; */

const Chart = ({symbol, interval, start_time, end_time} : CandleChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null >(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if(!chartContainerRef.current) return;


    if(!chartRef.current){
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#ffffff" },
          textColor: "#333",
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        grid: {
          vertLines: { color: "#eee" },
          horzLines: { color: "#eee" },
        },
      });
    }

    const chart = chartRef.current;
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      borderUpColor: "#26a69a",
      wickUpColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      wickDownColor: "#ef5350",
    } as CandlestickSeriesOptions );

     (async () => {
      const res = await fetch(
        `http://localhost:3001/api/candles?symbol=${symbol}&interval=${interval}&start_time=${start_time}&end_time=${end_time}`
      );
      const data: Candle[] = await res.json();
      candleSeries.setData(
        data.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    })();

    // Clean up when props change
    return () => {
      chart.removeSeries(candleSeries);
    };



  }, [symbol, interval, start_time, end_time]);


  return (


      <div
        ref={chartContainerRef}
        id="chart-container"
        className="w-full h-full border-2 border-neutral-600"
      />

  );
};

export default Chart;
