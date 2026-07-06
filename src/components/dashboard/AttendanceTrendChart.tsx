'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function AttendanceTrendChart({ data }: { data: { date: string, attendance: number }[] }) {
  if (!data || data.length === 0) return (
    <div className="h-[300px] flex items-center justify-center text-slate-500">
      No trend data available
    </div>
  )

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#64748B" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            stroke="#64748B" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px' }}
            itemStyle={{ color: '#0EA5E9' }}
            labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
            formatter={(value: unknown) => [`${Number(value)}%`, 'Attendance']}
          />
          <Line 
            type="monotone" 
            dataKey="attendance" 
            stroke="#0EA5E9" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#0EA5E9', stroke: '#0F172A', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
