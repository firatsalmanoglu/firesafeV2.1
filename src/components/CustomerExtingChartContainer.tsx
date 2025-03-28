import Image from "next/image";
import CountChart from "./CountChart";
import prisma from "@/lib/prisma";
import CustomerExtingChart from "./CustomerExtingChart";

const CustomerExtingChartContainer = async () => {
  const data1 = await prisma.devices.count({
    where: {
      currentStatus: {
        in: ["Aktif"], // currentStatus'si Aktif olan cihazların sayısı
      },
    },
  });

  const data2 = await prisma.devices.count({
    where: {
        currentStatus: {
        in: ["Pasif"], // currentStatus'si Pasif olan cihazların sayısı
      },
    },
  });

  console.log(data1);
  console.log(data2);
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Cihazlar</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CustomerExtingChart a={data1} p={data2} />

      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaSky rounded-full" />
          <h1 className="font-bold">{data1}</h1>
          <h2 className="text-xs text-[#000000]-300">
            Aktif ({Math.round((data1 / (data1 + data2)) * 100)}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaPurple rounded-full" />
          <h1 className="font-bold">{data2}</h1>
          <h2 className="text-xs text-[#000000]-300">
           Pasif ({Math.round((data2 / (data1 + data2)) * 100)}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CustomerExtingChartContainer;
