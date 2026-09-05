import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { BarChart2, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { MonthlyHoursPoint } from '../../lib/sessionAggregates';

interface ActivityChartProps {
  data: MonthlyHoursPoint[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#94A3B8' : '#64748B';
  const tooltipBg = theme === 'dark' ? '#18221F' : '#FFFFFF';
  const tooltipBorder = theme === 'dark' ? '#2A3833' : '#E2E8F0';

  const currentMonthPoint = data.find((d) => d.isCurrent);
  const currentMonthHours = currentMonthPoint ? currentMonthPoint.hours : 0;

  return (
    <div className="p-5 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-app-primary">Study Activity</h3>
            <p className="text-[11px] text-app-secondary">Hours spent learning per month</p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-app-bg text-app-secondary border border-app">
          Annual Log
        </span>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: textColor, fontSize: 10, fontWeight: 600 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: textColor, fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: any) => [`${value} hrs`, 'Study Time']}
            />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.isCurrent
                      ? '#F59E0B' // Amber highlight for current month
                      : theme === 'dark'
                      ? '#2A3833'
                      : '#CBD5E1'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-app-secondary pt-1 border-t border-app">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-amber-500" /> Current Month: {currentMonthHours} hrs
        </span>
        <span className="text-amber-500">Real Session Log</span>
      </div>
    </div>
  );
};
