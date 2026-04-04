import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ProbabilityGaugeProps {
  value: number;
  color: string;
}

export const ProbabilityGauge: React.FC<ProbabilityGaugeProps> = ({ value, color }) => {
  const data = [
    { value: value },
    { value: 100 - value },
  ];

  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span className="text-4xl font-bold tracking-tighter" style={{ color }}>
          {value}%
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          Confiança
        </span>
      </div>
    </div>
  );
};
