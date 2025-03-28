import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Önce veritabanını temizle
  await prisma.user.deleteMany()

  console.log('Veritabanı temizlendi')

  // Admin kullanıcısı oluştur
  const ayhPassword = await hash('Ayh2409', 10)
  const ayh = await prisma.user.create({
    data: {
      name: 'Ayhan Ugur',
      email: 'ayhan.ugur.35@gmail.com',
      password: ayhPassword,
      role: 'ADMIN',
      
    }
  })

   // Admin kullanıcısı oluştur
   const firatPassword = await hash('Frt2409', 10)
   const firat = await prisma.user.create({
     data: {
       name: 'Ayhan Ugur',
       email: 'firatsalmanoglu@gmail.com',
       password: firatPassword,
       role: 'ADMIN',
       
     }
   })

   // Admin kullanıcısı oluştur
   const serkanPassword = await hash('Sk2409', 10)
   const serkan = await prisma.user.create({
     data: {
       name: 'Ayhan Ugur',
       email: 'serkan.kormaz@firesafe.com.tr',
       password: serkanPassword,
       role: 'ADMIN',
       
     }
   })

  console.log('Admin kullanıcısı oluşturuldu:', ayh)
  console.log('Admin kullanıcısı oluşturuldu:', firat)
  console.log('Admin kullanıcısı oluşturuldu:', serkan)


  const devicetypes = await prisma.deviceTypes.createMany({
    data: [
        {name : "Yangın Tüpü"},
        {name : "Yangın Alarm Sistemi"},
        {name : "Flaşör"},
        {name : "Otomatik Su Sıstemi"},
        {name : "Otomatik Kapaklı Söndürme Sistemi"},
        {name : "Sprinkler"},
        {name : "Otomatik Gazlı Söndürme Sistemi"},
        {name : "Yangın Güvenlik Kapısı"},
        {name : "Duman Dedektörü"},
        {name : "Isı Dedektörü"},
        {name : "Yangın Merdiveni"},
        {name : "Yangın Hortumu"},
        {name : "Kaçış Yolu"},
        {name : "Alev Dedektörü"},
    ]
  })
  console.log('Device types olusturuldu:', devicetypes)


  const devicetype = await prisma.deviceTypes.findMany()

  const devicefeatures = await prisma.deviceFeatures.createMany({

    data: [
        {name : "CO2", deviceTypeId : devicetype[0]["id"]},
        {name : "Kuru Kimyevi Toz", deviceTypeId : devicetype[0]["id"]},
        {name : "Su (basınçlı)", deviceTypeId : devicetype[0]["id"]},
        {name : "Köpük", deviceTypeId : devicetype[0]["id"]},
        {name : "Halojen", deviceTypeId : devicetype[0]["id"]},

        {name : "Kablosuz", deviceTypeId : devicetype[1]["id"]},
        {name : "Ağ bağlantılı", deviceTypeId : devicetype[1]["id"]},

        {name : "LED", deviceTypeId : devicetype[2]["id"]},
        {name : "Ampül", deviceTypeId : devicetype[2]["id"]},

        {name : "Yüksek Basınç", deviceTypeId : devicetype[3]["id"]},
        {name : "Düşük Basınç", deviceTypeId : devicetype[3]["id"]},
        {name : "Çok ince su zerrecikleri", deviceTypeId : devicetype[3]["id"]},
        {name : "Kapsamlı sis", deviceTypeId : devicetype[3]["id"]},

        {name : "Su bazlı köpük", deviceTypeId : devicetype[4]["id"]},
        {name : "Alkol bazlı köpük", deviceTypeId : devicetype[4]["id"]},
        {name : "Karbondioksit bazlı köpük", deviceTypeId : devicetype[4]["id"]},

        {name : "CO2", deviceTypeId : devicetype[5]["id"]},
        {name : "Argon", deviceTypeId : devicetype[5]["id"]},
        {name : "FM-200", deviceTypeId : devicetype[5]["id"]},
        {name : "Novec 1230", deviceTypeId : devicetype[5]["id"]},
        {name : "İnert Gazlar", deviceTypeId : devicetype[5]["id"]},

        {name : "Islak Sistem", deviceTypeId : devicetype[6]["id"]},
        {name : "Kuru Sistem", deviceTypeId : devicetype[6]["id"]},
        {name : "Deluge Sistemi", deviceTypeId : devicetype[6]["id"]},
        {name : "Su Sprey Sistemi", deviceTypeId : devicetype[6]["id"]},

        {name : "Manuel Açma/Kapama Mekanizması", deviceTypeId : devicetype[7]["id"]},
        {name : "Otomatik Kapanma Mekanizması", deviceTypeId : devicetype[7]["id"]},

        {name : "İyonizasyonlu", deviceTypeId : devicetype[8]["id"]},
        {name : "Fotoelektrik", deviceTypeId : devicetype[8]["id"]},
        {name : "Optik", deviceTypeId : devicetype[8]["id"]},
        {name : "Lazer", deviceTypeId : devicetype[8]["id"]},
        {name : "Kombinasyonlu (iyonizasyonlu ve fotoelektrik)", deviceTypeId : devicetype[8]["id"]},

        {name : "Hızlı Yükselen Isı Dedektörü", deviceTypeId : devicetype[9]["id"]},
        {name : "Sabit Sıcaklık Dedektörü", deviceTypeId : devicetype[9]["id"]},

        {name : "İç Merdiven", deviceTypeId : devicetype[10]["id"]},
        {name : "Dış Merdiven", deviceTypeId : devicetype[10]["id"]},

        {name : "Storz Bağlantı", deviceTypeId : devicetype[11]["id"]},
        {name : "NH (National Hose) Bağlantı", deviceTypeId : devicetype[11]["id"]},
        {name : "İngiliz Bağlantı", deviceTypeId : devicetype[11]["id"]},
        {name : "Rupp Bağlantı", deviceTypeId : devicetype[11]["id"]},

        {name : "Aydınlatılmış", deviceTypeId : devicetype[12]["id"]},
        {name : "Aydınlatılmamış", deviceTypeId : devicetype[12]["id"]},

        {name : "UV Dedektörü", deviceTypeId : devicetype[13]["id"]},
        {name : "IR Dedektörü", deviceTypeId : devicetype[13]["id"]},
        {name : "Görünür Alev Dedektörü", deviceTypeId : devicetype[13]["id"]},
    ]
  })

  console.log('Device Features olusturuldu:', devicefeatures)

  const operation = await prisma.operations.createMany({

    data: [
        {name : "Montaj", deviceTypeId : devicetype[0]["id"]},
        {name : "Basınç", deviceTypeId : devicetype[0]["id"]},
        {name : "Hasar", deviceTypeId : devicetype[0]["id"]},
        {name : "Bakım Tarihi", deviceTypeId : devicetype[0]["id"]},
        {name : "Kullanım Talimatları", deviceTypeId : devicetype[0]["id"]},

        {name : "Kontrol Paneli", deviceTypeId : devicetype[1]["id"]},
        {name : "Güç", deviceTypeId : devicetype[1]["id"]},
        {name : "Sinyal İletimi", deviceTypeId : devicetype[1]["id"]},
        {name : "Sirenler", deviceTypeId : devicetype[1]["id"]},
        {name : "Flaşörler", deviceTypeId : devicetype[1]["id"]},
        {name : "Hata Kayıtları", deviceTypeId : devicetype[1]["id"]},
        {name : "Test Tarihi", deviceTypeId : devicetype[1]["id"]},

        {name : "Montaj", deviceTypeId : devicetype[2]["id"]},
        {name : "Güç", deviceTypeId : devicetype[2]["id"]},
        {name : "Yanıp Sönme", deviceTypeId : devicetype[2]["id"]},
        {name : "Işık Şiddeti", deviceTypeId : devicetype[2]["id"]},
        {name : "Bakım Tarihi", deviceTypeId : devicetype[2]["id"]},


        {name : "Nozullar", deviceTypeId : devicetype[3]["id"]},
        {name : "Pompa", deviceTypeId : devicetype[3]["id"]},
        {name : "Basınç", deviceTypeId : devicetype[3]["id"]},
        {name : "Depo Seviyesi", deviceTypeId : devicetype[3]["id"]},
        {name : "Test ve Bakım Tarihi", deviceTypeId : devicetype[3]["id"]},


        {name : "Konsantrasyon", deviceTypeId : devicetype[4]["id"]},
        {name : "Pompa", deviceTypeId : devicetype[4]["id"]},
        {name : "Depo Seviyesi", deviceTypeId : devicetype[4]["id"]},
        {name : "Test Ve Bakım Tarihi", deviceTypeId : devicetype[4]["id"]},


        {name : "Depo Seviyesi", deviceTypeId : devicetype[5]["id"]},
        {name : "Basınç", deviceTypeId : devicetype[5]["id"]},
        {name : "Test Ve Bakım Tarihi", deviceTypeId : devicetype[5]["id"]},
        {name : "Sızıntı", deviceTypeId : devicetype[5]["id"]},


        {name : "Başlıklar", deviceTypeId : devicetype[6]["id"]},
        {name : "Borular", deviceTypeId : devicetype[6]["id"]},
        {name : "Basınç", deviceTypeId : devicetype[6]["id"]},
        {name : "Depo Seviyesi", deviceTypeId : devicetype[6]["id"]},
        {name : "Test ve Bakım Tarihi", deviceTypeId : devicetype[6]["id"]},

        {name : "Dayanıklılık", deviceTypeId : devicetype[7]["id"]},
        {name : "Hasar", deviceTypeId : devicetype[7]["id"]},
        {name : "Menteşeler", deviceTypeId : devicetype[7]["id"]},
        {name : "Kilit", deviceTypeId : devicetype[7]["id"]},
        {name : "Bakım Tarihi", deviceTypeId : devicetype[7]["id"]},

        {name : "Montaj", deviceTypeId : devicetype[8]["id"]},
        {name : "Güç", deviceTypeId : devicetype[8]["id"]},
        {name : "Lens", deviceTypeId : devicetype[8]["id"]},
        {name : "Test Fonksiyonu", deviceTypeId : devicetype[8]["id"]},
        {name : "Alarm", deviceTypeId : devicetype[8]["id"]},
        {name : "Bakım Tarihi", deviceTypeId : devicetype[8]["id"]},

        {name : "Montaj", deviceTypeId : devicetype[9]["id"]},
        {name : "Güç", deviceTypeId : devicetype[9]["id"]},
        {name : "Test Fonksiyonu", deviceTypeId : devicetype[9]["id"]},
        {name : "Alarm Sıcaklığı", deviceTypeId : devicetype[9]["id"]},
        {name : "Bakım Tarihi", deviceTypeId : devicetype[9]["id"]},

        {name : "Sağlamlık", deviceTypeId : devicetype[10]["id"]},
        {name : "Aydınlatma", deviceTypeId : devicetype[10]["id"]},
        {name : "Hasar", deviceTypeId : devicetype[10]["id"]},
        {name : "Bakım Tarihi", deviceTypeId : devicetype[10]["id"]},

        {name : "Hasar", deviceTypeId : devicetype[11]["id"]},
        {name : "Bağlantı Parçaları", deviceTypeId : devicetype[11]["id"]},
        {name : "Temizlik", deviceTypeId : devicetype[11]["id"]},
        {name : "Test Tarihi", deviceTypeId : devicetype[11]["id"]},

        {name : "Açıklık", deviceTypeId : devicetype[12]["id"]},
        {name : "Aydınlatma", deviceTypeId : devicetype[12]["id"]},
        {name : "İşaretleme", deviceTypeId : devicetype[12]["id"]},
        {name : "Acil Çıkışlar", deviceTypeId : devicetype[12]["id"]},

        {name : "Montaj", deviceTypeId : devicetype[13]["id"]},
        {name : "Güç", deviceTypeId : devicetype[13]["id"]},
        {name : "Lens", deviceTypeId : devicetype[13]["id"]},
        {name : "Test Fonksiyonu", deviceTypeId : devicetype[13]["id"]},
        {name : "Algılama Aralığı", deviceTypeId : devicetype[13]["id"]},
        {name : "Bakım Tarihi", deviceTypeId : devicetype[13]["id"]},

    ]
  })

  console.log('Operations olusturuldu:', operation)

  const servicess = await prisma.services.createMany({
    data: [
        {name : "Bakım"},
    ]
  })
  console.log('Servicess types olusturuldu:', servicess)


  const paymenttermtype = await prisma.paymentTermTypes.createMany({
    data: [
        {name : "Peşin"},
        {name : "Çek"},
        {name : "3 Ay Vadeli"},
        {name : "6 Ay Vadeli"},

    ]
  })
  console.log('Paymentterm type olusturuldu:', paymenttermtype)

  const notificationtype = await prisma.notificationTypes.createMany({
     data: [
     {name : "Arıza"},
     {name : "Yaklaşan Bakım Tarihi"},
     {name : "Bakım Gerekli"},
     {name : "Güvenlik Uyarısı"},
     {name : "Yer Değişikliği"},
     {name : "Yeni Teklif"}, //YENİ EKLENECEK
    ]
    })

    console.log('notificationtype olusturuldu:', notificationtype)

  
}

main()
  .catch((e) => {
    console.error('Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })