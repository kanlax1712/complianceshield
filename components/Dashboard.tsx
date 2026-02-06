
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const data = [
    { name: 'Compliant', value: stats.totalItems - stats.expiredCount - stats.riskyCount - stats.regulatoryIssuesCount, color: '#38bdf8' },
    { name: 'Expired', value: stats.expiredCount, color: '#fb7185' },
    { name: 'Ingredient Risks', value: stats.riskyCount, color: '#f59e0b' },
    { name: 'Reg. Violations', value: stats.regulatoryIssuesCount, color: '#60a5fa' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="surface p-6 rounded-3xl shadow-sm border border-white/10 flex flex-col justify-center">
        <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-1">Total Items</p>
        <p className="text-4xl font-bold text-white">{stats.totalItems}</p>
      </div>

      <div className="surface p-6 rounded-3xl shadow-sm border border-white/10 col-span-1 md:col-span-2 flex items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.filter(d => d.value > 0)}
                innerRadius={30}
                outerRadius={45}
                paddingAngle={5}
                dataKey="value"
              >
                {data.filter(d => d.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-400"></div>
            <span className="text-xs text-white/70">Perfectly Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
            <span className="text-xs text-white/70">Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs text-white/70">Ingredient Risks</span>
          </div>
          <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-xs text-white/70">Reg. Violations</span>
          </div>
        </div>
      </div>

      <div className="surface p-6 rounded-3xl shadow-sm border border-white/10 flex flex-col justify-center">
        <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-1">Audit Health</p>
        <p className={`text-4xl font-bold ${stats.averageSafetyScore > 80 ? 'text-emerald-300' : 'text-amber-300'}`}>
          {Math.round(stats.averageSafetyScore)}%
        </p>
      </div>
    </div>
  );
};
