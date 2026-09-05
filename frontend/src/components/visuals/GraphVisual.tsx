import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { GraphSpec } from '../../types/sectionContent';

interface GraphVisualProps {
  spec: GraphSpec;
}

const SERIES_COLORS = ['#fbbf24', '#34d399', '#f87171', '#818cf8', '#a78bfa'];

export const GraphVisual: React.FC<GraphVisualProps> = ({ spec }) => {
  const { chartType = 'line', xLabel = 'X', yLabel = 'Y', series = [] } = spec;

  // Flatten data for Line/Bar chart if needed
  const chartData = React.useMemo(() => {
    if (!series || series.length === 0) return [];
    
    // For single series or multi-series aligned by X
    const xPointsMap = new Map<number, Record<string, any>>();
    series.forEach((s) => {
      s.points.forEach((p) => {
        const existing = xPointsMap.get(p.x) || { x: p.x };
        existing[s.name] = p.y;
        xPointsMap.set(p.x, existing);
      });
    });

    return Array.from(xPointsMap.values()).sort((a, b) => a.x - b.x);
  }, [series]);

  return (
    <div className="p-5 rounded-[20px] bg-app-bg border border-app space-y-4 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" />
          <span className="capitalize">{chartType} Data Visualization</span>
        </div>
        <span className="text-[11px] font-bold text-app-secondary">
          {yLabel} vs {xLabel}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="x" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {series.map((s, idx) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          ) : chartType === 'scatter' ? (
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="x" name={xLabel} stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="y" name={yLabel} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {series.map((s, idx) => (
                <Scatter
                  key={s.name}
                  name={s.name}
                  data={s.points}
                  fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
                />
              ))}
            </ScatterChart>
          ) : (
            /* Line Chart default */
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="x" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {series.map((s, idx) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
