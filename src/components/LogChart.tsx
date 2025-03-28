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
    müşteri: 4000,
    Sağlayıcı: 2400,
  },
  {
    name: "Şubat",
    müşteri: 3000,
    Sağlayıcı: 1398,
  },
  {
    name: "Mart",
    müşteri: 2000,
    Sağlayıcı: 9800,
  },
  {
    name: "Nisan",
    müşteri: 2780,
    Sağlayıcı: 3908,
  },
  {
    name: "Mayıs",
    müşteri: 1890,
    Sağlayıcı: 4800,
  },
  {
    name: "Haziran",
    müşteri: 2390,
    Sağlayıcı: 3800,
  },
  {
    name: "Temmuz",
    müşteri: 3490,
    Sağlayıcı: 4300,
  },
  {
    name: "Ağustos",
    müşteri: 3490,
    Sağlayıcı: 4300,
  },
  {
    name: "Eylül",
    müşteri: 3490,
    Sağlayıcı: 4300,
  },
  {
    name: "Ekim",
    müşteri: 3490,
    Sağlayıcı: 4300,
  },
  {
    name: "Kasım",
    müşteri: 3490,
    Sağlayıcı: 4300,
  },
  {
    name: "Aralık",
    müşteri: 3490,
    Sağlayıcı: 4300,
  },
];

const LogChart = () => {
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
          <YAxis axisLine={false} tick={{ fill: "#00000" }} tickLine={false}  tickMargin={20}/>
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
          <Line type="monotone" dataKey="Sağlayıcı" stroke="#FAE27C" strokeWidth={5}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LogChart;
