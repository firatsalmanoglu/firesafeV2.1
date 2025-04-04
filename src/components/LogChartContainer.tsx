// components/LogChartContainer.tsx
import prisma from "@/lib/prisma"; // { prisma } yerine default import kullanıyoruz
import LogChart from "@/components/LogChart";
import { User, Logs } from "@prisma/client"; // Tip tanımlamaları için

type LogWithUser = Logs & {
  user: User;
};

export default async function LogChartContainer() {
  // Mevcut yılın başlangıç ve bitiş tarihlerini oluştur
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1); // 1 Ocak
  const endDate = new Date(currentYear, 11, 31); // 31 Aralık

  // Veritabanından logları çek
  const logs = await prisma.logs.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: true, // User ilişkisini dahil et
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Ayları oluştur
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // Müşteri, sağlayıcı ve admin rolleri
  const customerRoles = ['MUSTERI_SEVIYE1', 'MUSTERI_SEVIYE2'];
  const providerRoles = ['HIZMETSAGLAYICI_SEVIYE1', 'HIZMETSAGLAYICI_SEVIYE2'];
  const adminRoles = ['ADMIN'];

  // Aylara göre logları grupla
  const chartData = months.map((month, index) => {
    // İlgili ay için başlangıç ve bitiş tarihleri
    const monthStart = new Date(currentYear, index, 1);
    const monthEnd = new Date(currentYear, index + 1, 0);

    // Bu aya ait tüm loglar
    const monthLogs = logs.filter((log: LogWithUser) => {
      const logDate = new Date(log.date);
      return logDate >= monthStart && logDate <= monthEnd;
    });

    // Müşteri, sağlayıcı ve admin loglarını ayrıştır
    const customerLogs = monthLogs.filter((log: LogWithUser) => 
      customerRoles.includes(log.user.role)
    ).length;

    const providerLogs = monthLogs.filter((log: LogWithUser) => 
      providerRoles.includes(log.user.role)
    ).length;
    
    const adminLogs = monthLogs.filter((log: LogWithUser) => 
      adminRoles.includes(log.user.role)
    ).length;

    return {
      name: month,
      müşteri: customerLogs,
      Sağlayıcı: providerLogs,
      admin: adminLogs,
    };
  });

  return <LogChart data={chartData} />;
}