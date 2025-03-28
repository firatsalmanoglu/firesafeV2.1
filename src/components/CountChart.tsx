"use client";
import Image from "next/image";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";


const CountChart = ({musteri,ss}:{musteri:number, ss:number}) => {
const data = [
  {
    name: "Toplam",
    count: musteri+ss,
    fill: "white",
  },
  {
    name: "Müşteri",
    count: musteri,
    fill: "#EA4C4C",
  },
  {
    name: "Servis Sağlayıcı",
    count: ss,
    fill: "#FAE27C",
  },
];


  return (
    <div className="relative w-full h-[75%]">
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="100%"
            barSize={32}
            data={data}
          >
            <RadialBar background dataKey="count" />
          </RadialBarChart>
        </ResponsiveContainer>
        <Image
          src="/users.png"
          alt=""
          width={75}
          height={75}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      
  );
};

export default CountChart;
