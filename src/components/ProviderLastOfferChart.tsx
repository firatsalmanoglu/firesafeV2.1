"use client";
import Image from "next/image";
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    name: "Pzt.",
    teklif: 60,
    kabul: 40,
  },
  {
    name: "Salı",
    teklif: 90,
    kabul: 75,
  },
  {
    name: "Çarş.",
    teklif: 90,
    kabul: 75,
  },
  {
    name: "Perş.",
    teklif: 65,
    kabul: 55,
  },
  {
    name: "Cuma.",
    teklif: 65,
    kabul: 55,
  },
  {
    name: "C.Tesi",
    teklif: 65,
    kabul: 55,
  },
  {
    name: "Paz.",
    teklif: 65,
    kabul: 55,
  },
];

const ProviderLastOfferChart = () => {
  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Son 1 Haftalık Teklif Görünümü</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart width={500} height={300} data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#00000" }}
            tickLine={false}
          />
          <YAxis axisLine={false} tick={{ fill: "#00000" }} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
          />
          <Legend
            align="left"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
          />
          <Bar
            dataKey="teklif"
            fill="#EA4C4C"
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />
          <Bar
            dataKey="kabul"
            fill="#FAE27C"
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProviderLastOfferChart;
