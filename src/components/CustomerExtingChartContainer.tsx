import Image from "next/image";
import prisma from "@/lib/prisma";
import CustomerExtingChart from "./CustomerExtingChart";
import { auth } from "@/auth";

const CustomerExtingChartContainer = async () => {
  // Menü bileşeninde kullandığınız aynı yöntemle kullanıcı oturumunu al
  const session = await auth();
  
  // Kullanıcı kimliğini al
  const userId = session?.user?.id;
  
  // Varsayılan sorgu - tüm cihazlar için
  let data1 = 0;
  let data2 = 0;
  
  if (userId) {
    // Kullanıcının kurum kimliğini al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { institutionId: true }
    });
    
    const institutionId = user?.institutionId;
    
    console.log("Kullanıcı ID:", userId);
    console.log("Kurum ID:", institutionId);
    
    if (institutionId) {
      // Kuruma ait aktif cihazların sayısını çek
      data1 = await prisma.devices.count({
        where: {
          ownerInstId: institutionId,
          currentStatus: "Aktif"
        }
      });
      
      // Kuruma ait pasif cihazların sayısını çek
      data2 = await prisma.devices.count({
        where: {
          ownerInstId: institutionId,
          currentStatus: "Pasif"
        }
      });
      
      console.log("Kuruma ait aktif cihazlar:", data1);
      console.log("Kuruma ait pasif cihazlar:", data2);
    } else {
      console.log("Kullanıcının kurumu bulunamadı");
    }
  } else {
    console.log("Oturum bilgisi bulunamadı");
  }
  
  const total = data1 + data2;
  
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
            Aktif ({total > 0 ? Math.round((data1 / total) * 100) : 0}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaPurple rounded-full" />
          <h1 className="font-bold">{data2}</h1>
          <h2 className="text-xs text-[#000000]-300">
           Pasif ({total > 0 ? Math.round((data2 / total) * 100) : 0}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CustomerExtingChartContainer;