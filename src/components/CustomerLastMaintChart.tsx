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

const data = [
  {
    name: "Ocak",
    talep: 4000,
    gerçekleşen: 2400,
  },
  {
    name: "Şubat",
    talep: 3000,
    gerçekleşen: 1398,
  },
  {
    name: "Mart",
    talep: 2000,
    gerçekleşen: 9800,
  },
  {
    name: "Nisan",
    talep: 2780,
    gerçekleşen: 3908,
  },
  {
    name: "Mayıs",
    talep: 1890,
    gerçekleşen: 4800,
  },
  {
    name: "Haziran",
    talep: 2390,
    gerçekleşen: 3800,
  },
  {
    name: "Temmuz",
    talep: 3490,
    gerçekleşen: 4300,
  },
  {
    name: "Ağustos",
    talep: 3490,
    gerçekleşen: 4300,
  },
  {
    name: "Eylül",
    talep: 3490,
    gerçekleşen: 4300,
  },
  {
    name: "Ekim",
    talep: 3490,
    gerçekleşen: 4300,
  },
  {
    name: "Kasım",
    talep: 3490,
    gerçekleşen: 4300,
  },
  {
    name: "Aralık",
    talep: 3490,
    gerçekleşen: 4300,
  },
];

const CustomerLastMaintChart = () => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Bakım Geçmişi</h1>
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
          <YAxis axisLine={false} tick={{ fill: "#00000" }} tickLine={false}  tickMargin={20}/>
          <Tooltip />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          {/* <Line
            type="monotone"
            dataKey="talep"
            stroke="#C40808"
            strokeWidth={5}
          /> */}
          <Line 
            type="monotone" 
            dataKey="gerçekleşen" 
            stroke="#EA4C4C" 
            strokeWidth={5}
            />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomerLastMaintChart;
