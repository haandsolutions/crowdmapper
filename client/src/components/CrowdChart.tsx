import { useEffect, useRef } from "react";
import { CrowdLevel } from "@/lib/types";
import { formatChartTime, prepareCrowdHistoryData, getCrowdLevelColor } from "@/lib/crowd-utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";

interface CrowdChartProps {
  crowdHistory: CrowdLevel[];
}

export default function CrowdChart({ crowdHistory }: CrowdChartProps) {
  const chartData = prepareCrowdHistoryData(crowdHistory);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const level = data.level;
      const color = getCrowdLevelColor(level);
      
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200">
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-sm font-semibold ${color.lightText}`}>
            {data.percentage}% occupied
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="bg-white border rounded-lg p-3 h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickCount={5}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="percentage" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={{ 
              stroke: '#3B82F6', 
              strokeWidth: 2, 
              r: 4, 
              fill: 'white' 
            }}
            activeDot={{ r: 6, fill: '#3B82F6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
