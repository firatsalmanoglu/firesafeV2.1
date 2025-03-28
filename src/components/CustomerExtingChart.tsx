"use client";
import Image from "next/image";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";


const CustomerExtingChart = ({a,p}:{a:number, p:number}) => {
const data = [
  {
    name: "Toplam",
    count: a+p,
    fill: "white",
  },
  {
    name: "Aktif",
    count: a,
    fill: "#EA4C4C",
  },
  {
    name: "Pasif",
    count: p,
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
          src="/black-fire-extinguisher.png"
          alt=""
          width={75}
          height={75}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      
  );
};

export default CustomerExtingChart;
