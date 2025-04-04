// components/LogChart.tsx
"use client";

import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Tip tanımlaması
type LogChartProps = {
  data: {
    name: string;
    müşteri: number;
    Sağlayıcı: number;
    admin: number;
  }[];
};

const LogChart = ({ data }: LogChartProps) => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Log Kayıtları</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#00000" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis axisLine={false} tick={{ fill: "#00000" }} tickLine={false} tickMargin={20} />
          <Tooltip />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line
            type="monotone"
            dataKey="müşteri"
            stroke="#EA4C4C"
            strokeWidth={5}
          />
          <Line 
            type="monotone" 
            dataKey="Sağlayıcı" 
            stroke="#FAE27C" 
            strokeWidth={5} 
          />
          <Line 
            type="monotone" 
            dataKey="admin" 
            stroke="#4287f5" 
            strokeWidth={5} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LogChart;