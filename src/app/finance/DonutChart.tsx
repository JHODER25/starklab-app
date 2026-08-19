'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#ff1a1a', '#00f3ff', '#b026ff', '#ffeb3b', '#00ff66', '#ff7300', '#ff00a0'];

export default function DonutChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <filter id="neonGlowPie" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,0,0,0.3)', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#ff1a1a', fontWeight: 'bold' }}
            formatter={(value: any) => [`$${value}`, 'Gastado']}
          />
          <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#ccc' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
