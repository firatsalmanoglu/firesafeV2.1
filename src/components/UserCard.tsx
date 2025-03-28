import Image from "next/image";
import prisma from "@/lib/prisma";


const UserCard = async ({
  type,
  link,
}: {

type: "teklifler" | "bakimlar" | "cihazlar" | "randevular" | "cihazlarim" | "bakimiyaklasan" | "tekliflerim" | "bakimlarim" |
       "tekliflerimm" | "bekleyen" | "yaklasanrandevularim" | "bakimlarimm"; // Yeni türleri ekledik
link: string;
}) => {

  
  const modelMap: Record<typeof type, any> = {
    teklifler: prisma.offerCards,
    bakimlar: prisma.maintenanceCards,
    cihazlar: prisma.devices,
    randevular: prisma.appointments,
    cihazlarim: prisma.devices,
    bakimiyaklasan: prisma.devices,
    tekliflerim: prisma.offerCards,
    bakimlarim: prisma.maintenanceCards,
    tekliflerimm: prisma.offerCards, // Yeni türler için modeller
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
    // .count() çalıştır
    data = await modelMap[type].count();
  } else {
    // Özel where sorgusu ile .count() çalıştır
    let whereClause;

    switch (type) {
      case "cihazlarim":
      case "bakimiyaklasan":
        whereClause = { ownerId:"2" };
        break;
      case "tekliflerim":
        whereClause = { recipientInsId: "2" };
        break;
      case "bakimlarim":
        whereClause = { customerInsId: "2" };
        break;
      case "tekliflerimm":
        whereClause = { creatorId: "2" };
        break;
      case "bekleyen":
        whereClause = { creatorId: "2", status: "Beklemede" };
        break;
      case "yaklasanrandevularim":
        whereClause = { creatorId: "2" };
        break;
      case "bakimlarimm":
        whereClause = { providerId: "2" };
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
  // Diğer türler için gerekli Türkçe isimlendirmeleri ekleyebilirsiniz.
};

// Bugünün tarihini al
const today = new Date();

// Türkçe format ile tarihi yazdır
const formattedDate = new Intl.DateTimeFormat("tr-TR").format(today);

//console.log(formattedDate); // Örneğin: "13.11.2024"

  return (
    <a href={link} className="rounded-2xl odd:bg-lamaSky even:bg-lamaPurple p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
        {formattedDate}
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{data}</h1>
      {/* <h2 className="capitalize text-sm font-medium text-whitetext">{type}</h2> */}
      <h2 className="capitalize text-sm font-medium text-whitetext">{typeLabels[type]}</h2>
    
    </a>
  );
};

export default UserCard;