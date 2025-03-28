import Image from "next/image"
import OfferChart from "./OfferChart"
import prisma from "@/lib/prisma"

const OfferChartContainer = async () => {
   // Bugünün tarihini al ve UTC'ye göre başlangıcını ayarla
   const today = new Date()
   const startOfToday = new Date(today)
   startOfToday.setHours(0, 0, 0, 0)

   // Son Pazartesi'yi bul
   const dayOfWeek = today.getDay()
   const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
   const lastMonday = new Date(startOfToday)
   lastMonday.setDate(lastMonday.getDate() - diff)

   // Debug logları
   console.log({
       today: today.toISOString(),
       startOfToday: startOfToday.toISOString(), 
       lastMonday: lastMonday.toISOString()
   })

   // Tüm teklifleri getir (debug için)
   const allOffers = await prisma.offerCards.findMany({
       select: {
           offerDate: true,
           status: true,
       }
   })
   console.log("Tüm teklifler:", allOffers)

   // Son pazartesiden sonraki teklifleri getir
   const resData = await prisma.offerCards.findMany({
       where: {
           offerDate: {
               gte: lastMonday.toISOString(),
           },
       },
       select: {
           offerDate: true,
           status: true,
       },
   })

   console.log("Filtrelenmiş veriler:", resData)

   const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"]

   // Başlangıç değerleri
   const offerMap: { [key: string]: {kabul: number; red: number; beklemede: number} } = {
       Mon: {kabul: 0, red: 0, beklemede: 0},
       Tue: {kabul: 0, red: 0, beklemede: 0},
       Wed: {kabul: 0, red: 0, beklemede: 0},
       Thu: {kabul: 0, red: 0, beklemede: 0},
       Fri: {kabul: 0, red: 0, beklemede: 0},
   }

   // Verileri işle
   resData.forEach(item => {
       const itemDate = new Date(item.offerDate)
       const itemDayOfWeek = itemDate.getDay()

       console.log("İşlenen kayıt:", {
           originalDate: item.offerDate,
           parsedDate: itemDate,
           dayOfWeek: itemDayOfWeek,
           status: item.status
       })

       // Sadece hafta içi günleri (1-5) işle
       if (itemDayOfWeek >= 1 && itemDayOfWeek <= 5) {
           const dayName = daysOfWeek[itemDayOfWeek - 1]

           // Status kontrolü ve sayaç artırımı
           switch(item.status) {
               case "Onaylandi":
                   offerMap[dayName].kabul += 1
                   break
               case "Red":
                   offerMap[dayName].red += 1
                   break
               case "Beklemede":
                   offerMap[dayName].beklemede += 1
                   break
               default:
                   console.log("Bilinmeyen status:", item.status)
           }
       }
   })

   // Chart verisi oluştur
   const data = daysOfWeek.map(day => ({
       name: day,
       kabul: offerMap[day].kabul,
       red: offerMap[day].red,
       beklemede: offerMap[day].beklemede,
   }))

   console.log("Chart verisi:", data)

   return (
       <div className="bg-white rounded-lg p-4 h-full">
           <div className="flex justify-between items-center">
               <h1 className="text-lg font-semibold">Teklifler/Kabul Edilenler</h1>
               <Image src="/moreDark.png" alt="" width={20} height={20} />
           </div>
           <OfferChart data={data}/>
       </div>
   )
}

export default OfferChartContainer