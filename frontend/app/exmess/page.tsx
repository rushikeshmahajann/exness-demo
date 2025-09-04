
"use client";
import React, { useState } from "react";
import Chart from "@/components/Chart";


const App = () => {
  
  const [symbols, setSymbols] = useState([
    { name: "BTCUSDT", ask: "65,245.75", bid: "65,240.10" },
    { name: "ETHUSDT", ask: "3,800.20", bid: "3,799.85" },
    { name: "SOLUSDT", ask: "148.55", bid: "148.30" },
  ]);


    const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 2 * 24 * 60 * 60;

  return (
    <div className="font-sans text-white bg-neutral-200 min-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 bg-white shadow-lg rounded-md">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-neutral-700 tracking-tight">
            exmess
          </h1>

        </div>
        <div className="flex items-center space-x-8">
          <div className="text-right">
            <span className="text-sm text-neutral-500 font-medium">
              Balance
            </span>
            <div className="text-xl font-bold text-neutral-300">
              $1,250,500.00
            </div>
          </div>
          <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center font-bold text-lg text-neutral-300 border border-neutral-700">
            A
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 p-2 space-x-2 overflow-hidden">
        {/* Left: Favorite Symbols Panel */}
        <aside
          className={`bg-white p-6 rounded-md shadow-xl transition-all duration-300 ease-in-out w-80`}
        >
          
            <div className="flex flex-col space-y-5">
              <h2 className="text-xl font-bold text-neutral-300">
                Favorite Symbols
              </h2>
              {symbols.map((symbol) => (
                <div
                  key={symbol.name}
                  className="bg-neutral-900 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-neutral-800 transition-colors duration-200"
                >
                  <div>
                    <div className="font-semibold text-lg">{symbol.name}</div>
                    <div className="text-xs text-neutral-500">Perpetual</div>
                  </div>
                  <div className="text-right text-base">
                    <div className="text-green-500 font-bold">
                      Ask: {symbol.ask}
                    </div>
                    <div className="text-red-500 font-bold">
                      Bid: {symbol.bid}
                    </div>
                  </div>
                </div>
              ))}
            </div>

        </aside>

        {/* Center: Chart View */}
        <section className="flex-1 bg-white p-6 rounded-md shadow-xl">
          <Chart
            symbol="BTCUSDT"
            interval="1m"
            start_time={oneHourAgo}
            end_time={now}
          />
        </section>

        {/* Right: Buy/Sell Panel */}
        <aside className="w-96 bg-white p-6 rounded-md shadow-xl">
          <h2 className="text-xl font-bold text-center text-neutral-300 mb-6">
            Order
          </h2>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <button className="flex-1 py-4 text-center rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 shadow-lg">
                Buy
              </button>
              <button className="flex-1 py-4 text-center rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 shadow-lg">
                Sell
              </button>
            </div>
            <div>
              <label
                htmlFor="amount"
                className="block text-sm text-neutral-400 mb-2"
              >
                Amount
              </label>
              <input
                id="amount"
                type="number"
                placeholder="0.00"
                className="w-full bg-neutral-900 rounded-xl p-4 text-neutral-300 placeholder-neutral-500 border border-neutral-800 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="price"
                className="block text-sm text-neutral-400 mb-2"
              >
                Price
              </label>
              <input
                id="price"
                type="number"
                placeholder="0.00"
                className="w-full bg-neutral-900 rounded-xl p-4 text-neutral-300 placeholder-neutral-500 border border-neutral-800 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 outline-none transition-colors"
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
