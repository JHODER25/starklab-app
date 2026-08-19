'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function FinanceChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff1a1a" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#ff1a1a" stopOpacity={0}/>
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#666', fontSize: 11 }} 
            tickFormatter={(value) => `$${value}`}
            width={40}
            dx={-10}
          />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#666', fontSize: 12 }} 
            dy={10}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,0,0,0.5)', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#ff1a1a', fontWeight: 'bold' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#ff1a1a" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            style={{ filter: 'url(#neonGlow)' }}
            activeDot={{ r: 6, fill: '#050505', stroke: '#ff1a1a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
