import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const UserCard = async ({
  type,
  link,
}: {
  type: "teklifler" | "bakimlar" | "cihazlar" | "randevular" | "cihazlarim" | "bakimiyaklasan" | "tekliflerim" | "bakimlarim" |
       "tekliflerimm" | "bekleyen" | "yaklasanrandevularim" | "bakimlarimm";
  link: string;
}) => {
  // Kullanıcı kimliğini al
  const session = await auth();
  const userId = session?.user?.id || "";
  
  // Kullanıcı bilgilerini veritabanından al (institutionId dahil)
  const userWithInstitution = await prisma.user.findUnique({
    where: { id: userId },
    select: { institutionId: true }
  });
  
  const institutionId = userWithInstitution?.institutionId || "";

  const modelMap: Record<typeof type, any> = {
    teklifler: prisma.offerCards,
    bakimlar: prisma.maintenanceCards,
    cihazlar: prisma.devices,
    randevular: prisma.appointments,
    cihazlarim: prisma.devices,
    bakimiyaklasan: prisma.devices,
    tekliflerim: prisma.offerCards,
    bakimlarim: prisma.maintenanceCards,
    tekliflerimm: prisma.offerCards,
    bekleyen: prisma.offerCards,
    yaklasanrandevularim: prisma.appointments,
    bakimlarimm: prisma.maintenanceCards,
  };

  let data;

  if (
    type === "teklifler" ||
    type === "bakimlar" ||
    type === "cihazlar" ||
    type === "randevular"
  ) {
    // Admin için tüm kayıtları say
    data = await modelMap[type].count();
  } else {
    // Kullanıcıya özel sorgular
    let whereClause;

    switch (type) {
      case "cihazlarim":
        // Kullanıcının owner olduğu cihazlar
        whereClause = { ownerId: userId };
        break;
        break;
      case "bakimiyaklasan":
        // Kullanıcının owner olduğu ve bakımı yaklaşan cihazlar
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        
        whereClause = { 
          ownerId: userId,
          nextControlDate: {
            lte: thirtyDaysLater
          }
        };
        break;
        break;
      case "tekliflerim":
        // Kullanıcının kurumuna gelen teklifler
        whereClause = { recipientInsId: institutionId };
        break;
      case "bakimlarim":
        // Kullanıcının kurumuna yapılan bakımlar
        whereClause = { customerInsId: institutionId };
        break;
      case "tekliflerimm":
        // Kullanıcının oluşturduğu teklifler
        whereClause = { creatorId: userId };
        break;
      case "bekleyen":
        // Kullanıcının bekleyen teklifleri
        whereClause = { creatorId: userId, status: "Beklemede" };
        break;
      case "yaklasanrandevularim":
        // Kullanıcının kurumunun oluşturduğu yaklaşan randevular
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        whereClause = { 
          creatorInsId: institutionId,
          start: {
            gte: new Date(),
            lte: nextWeek
          }
        };
        break;
        break;
      case "bakimlarimm":
        // Kullanıcının sağladığı bakımlar (servis sağlayıcı rolü için)
        whereClause = { providerId: userId };
        break;
      default:
        whereClause = {};
    }

    const model = modelMap[type];
    if (!model) {
      throw new Error(`Model not found for type: ${type}`);
    }

    // Sayısını al
    data = await modelMap[type].count({
      where: whereClause,
    });
  }

  // Türkçe isimlerin eşleştirmesini yapıyoruz.
  const typeLabels: Record<string, string> = {
    teklifler: "Tüm Teklifler",
    bakimlar: "Tüm Bakımlar",
    cihazlar: "Tüm Cihazlar",
    randevular: "Tüm Randevular",
    cihazlarim: "Cihazlarım",
    bakimiyaklasan: "Bakımı Yaklaşan Cihazlarım",
    tekliflerim: "Tekliflerim",
    bakimlarim: "Bakımlarım",
    tekliflerimm: "Tekliflerim",
    bekleyen: "Bekleyen Tekliflerim",
    yaklasanrandevularim: "Yaklaşan Randevularım",
    bakimlarimm: "Bakımlarım",
  };

  // Bugünün tarihini al
  const today = new Date();

  // Türkçe format ile tarihi yazdır
  const formattedDate = new Intl.DateTimeFormat("tr-TR").format(today);

  return (
    <a href={link} className="rounded-2xl odd:bg-lamaSky even:bg-lamaPurple p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          {formattedDate}
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{data}</h1>
      <h2 className="capitalize text-sm font-medium text-whitetext">{typeLabels[type]}</h2>
    </a>
  );
};

export default UserCard;