"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import marketData from "@/app/data/market_crash.json";
import { useEffect, useState } from 'react';

export default function LiquidityChart() {
  // Fix: Only render chart on client side to prevent size mismatch warnings
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[300px] p-4 bg-slate-900 border rounded-xl mt-4 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading Market Data...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] p-4 bg-slate-900 border rounded-xl mt-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">Binance Order Book Liquidity vs Price</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={marketData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94a3b8" />
          
          {/* Left Axis: Liquidity Volume */}
          <YAxis yAxisId="left" stroke="#94a3b8" />
          {/* Right Axis: Price (Since the scales are different) */}
          <YAxis yAxisId="right" orientation="right" stroke="#f8fafc" />

          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} 
          />
          <Legend />

          {/* Line 1: Buy Liquidity (The Signal) - Green */}
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="buyLiquidity" 
            stroke="#22c55e" 
            strokeWidth={3} 
            name="Buy Liquidity" 
            dot={false}
          />

          {/* Line 2: Price (The Lagging Reality) - White */}
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="price" 
            stroke="#f8fafc" 
            strokeWidth={2} 
            name="ETH Price ($)" 
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}