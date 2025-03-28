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



const OfferChart = ({
  data,
}:{
  data: {name:string, kabul: number, red:number, beklemede:number} [];
}) => {
  console.log("Chart'a gelen data:", data);
  return (
    
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
            dataKey="kabul"
            fill="#EA4C4C"
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />

          
          <Bar
            dataKey="red"
            fill="#FAE27C"
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />

          <Bar
            dataKey="beklemede"
            fill="#ea723e"
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    
  );
};

export default OfferChart;
