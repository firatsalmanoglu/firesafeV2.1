// components/CustomerLastMaintChartContainer.tsx
import prisma from "@/lib/prisma";
import CustomerLastMaintChart from "./CustomerLastMaintChart";
import { auth } from "@/auth";

const CustomerLastMaintChartContainer = async () => {
  // Kullanıcı oturumunu al
  const session = await auth();
  
  // Kullanıcının kurum ID'sini al
  const userId = session?.user?.id;
  
  if (!userId) {
    console.log("Kullanıcı girişi yapılmamış");
    return <CustomerLastMaintChart data={[]} />;
  }
  
  // Kullanıcı bilgilerini ve bağlı olduğu kurumu getir
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { institutionId: true }
  });
  
  if (!user?.institutionId) {
    console.log("Kullanıcı bir kuruma bağlı değil");
    return <CustomerLastMaintChart data={[]} />;
  }
  
  // Mevcut yılın başlangıç ve bitiş tarihlerini oluştur
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1); // 1 Ocak
  const endDate = new Date(currentYear, 11, 31); // 31 Aralık
  
  // Kullanıcının kurumuna ait tüm bakım kayıtlarını getir
  const maintenanceRecords = await prisma.maintenanceCards.findMany({
    where: {
      customerInsId: user.institutionId,
      maintenanceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      maintenanceDate: 'asc',
    },
  });
  
  console.log(`${maintenanceRecords.length} bakım kaydı bulundu`);
  
  // Ayları oluştur
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  // Aylara göre bakım kayıtlarını grupla
  const chartData = months.map((month, index) => {
    // İlgili ay için başlangıç ve bitiş tarihleri
    const monthStart = new Date(currentYear, index, 1);
    const monthEnd = new Date(currentYear, index + 1, 0);
    
    // Bu aya ait tüm bakım kayıtları
    const monthMaintenance = maintenanceRecords.filter(record => {
      const maintDate = new Date(record.maintenanceDate);
      return maintDate >= monthStart && maintDate <= monthEnd;
    });
    
    return {
      name: month,
      gerçekleşen: monthMaintenance.length,
    };
  });
  
  return <CustomerLastMaintChart data={chartData} />;
};

export default CustomerLastMaintChartContainer;