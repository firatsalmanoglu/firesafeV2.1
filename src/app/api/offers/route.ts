// app/api/offers/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Gelen isteği logla
    console.log('1. API - Gelen ham veri:', JSON.stringify(body, null, 2));
    console.log('2. Tarih alanları:', {
      offerDate: body.offerDate,
      validityDate: body.validityDate,
      parsedOfferDate: new Date(body.offerDate),
      parsedValidityDate: new Date(body.validityDate)
    });
    console.log('3. Kullanıcı ve kurum bilgileri:', {
      creator: { id: body.creatorId, insId: body.creatorInsId },
      recipient: { id: body.recipientId, insId: body.recipientInsId }
    });
    console.log('4. Alt kalem detayları:', body.offerSub);

    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log('5. Transaction başlatılıyor');

        // Ana teklif oluşturma
        console.log('6. Ana teklif verisi hazırlanıyor:', {
          offerDate: new Date(body.offerDate),
          validityDate: new Date(body.validityDate),
          status: body.status || "Beklemede",
          details: body.details,
          paymentTermId: body.paymentTermId,
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
          recipientId: body.recipientId,
          recipientInsId: body.recipientInsId,
        });

        const offer = await tx.offerCards.create({
          data: {
            offerDate: new Date(body.offerDate),
            validityDate: new Date(body.validityDate),
            status: body.status || "Beklemede",
            details: body.details,
            paymentTermId: body.paymentTermId,
            creatorId: body.creatorId,
            creatorInsId: body.creatorInsId,
            recipientId: body.recipientId,
            recipientInsId: body.recipientInsId,
            requestId: body.requestId,
          },
        });
        console.log('7. Ana teklif oluşturuldu:', offer);

        // Alt kalemleri oluşturma
        console.log('8. Alt kalemler oluşturmaya başlanıyor');
        const offerSubPromises = body.offerSub.map((sub: any, index: number) => {
          const subData = {
            servideId: sub.serviceId,
            unitPrice: parseFloat(sub.unitPrice),
            size: parseFloat(sub.size),
            detail: sub.detail,
            offerCardId: offer.id,
          };
          console.log(`9. Alt kalem ${index + 1} verisi:`, subData);
          
          return tx.offerSub.create({
            data: subData
          }).then(result => {
            console.log(`10. Alt kalem ${index + 1} oluşturuldu:`, result);
            return result;
          }).catch(error => {
            console.error(`Hata: Alt kalem ${index + 1} oluşturulamadı:`, error);
            throw error;
          });
        });

        const createdSubItems = await Promise.all(offerSubPromises);
        console.log('11. Tüm alt kalemler oluşturuldu:', createdSubItems);
   
        // Bildirim oluşturma
        const notificationType = await tx.notificationTypes.findFirstOrThrow({
            where: { name: 'Yeni Teklif' }
         });
        console.log('12. Bildirim oluşturuluyor');
        const notification = await tx.notifications.create({
          data: {
            content: `Yeni bir teklif aldınız. Teklif detayı: ${body.details}`,
            creatorId: body.creatorId,
            creatorInsId: body.creatorInsId,
            recipientId: body.recipientId,
            recipientInsId: body.recipientInsId,
            notificationDate: new Date(),
            isRead: 'Okunmadi',
            typeId: notificationType.id,
          }
        }).then(result => {
          console.log('13. Bildirim oluşturuldu:', result);
          return result;
        }).catch(error => {
          console.error('Hata: Bildirim oluşturulamadı:', error);
          throw error;
        });

        console.log('14. Transaction başarıyla tamamlandı');
        return { offer, notification };
      });

      console.log('15. Sonuç başarıyla dönülüyor:', result);
      return NextResponse.json(result);

    } catch (txError: any) {
      console.error('16. Transaction hatası:', {
        name: txError.name,
        message: txError.message,
        code: txError.code,
        meta: txError.meta,
        stack: txError.stack
      });
      throw txError;
    }
  } catch (error: any) {
    console.error('17. Genel hata:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      ...(error.cause && { cause: error.cause })
    });
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Teklif oluşturulurken bir hata oluştu', 
        details: error.message,
        code: error.code,
        meta: error.meta,
        errorType: error.constructor.name
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET() {
  try {
    console.log('GET: Teklifler getiriliyor');
    const offers = await prisma.offerCards.findMany({
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
        paymentTerm: true,
        OfferSub: {    
          include: {
            service: true
          }
        }
      },
      orderBy: {
        offerDate: 'desc'
      }
    });
    
    console.log(`GET: ${offers.length} adet teklif getirildi`);
    return NextResponse.json(offers);
  } catch (error: any) {
    console.error('GET: Teklifler getirme hatası:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return new NextResponse('Teklifler alınırken bir hata oluştu', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('DELETE: Silinecek teklif ID:', id);

    if (!id) {
      console.log('DELETE: ID parametresi eksik');
      return new NextResponse("ID parametresi gerekli", { status: 400 });
    }

    const existingOffer = await prisma.offerCards.findUnique({
      where: { id },
      include: { OfferSub: true }
    });

    if (!existingOffer) {
      console.log('DELETE: Teklif bulunamadı:', id);
      return new NextResponse("Teklif bulunamadı", { status: 404 });
    }

    console.log('DELETE: Mevcut teklif bulundu:', existingOffer);

    await prisma.$transaction(async (tx) => {
      console.log('DELETE: Alt kalemler siliniyor');
      await tx.offerSub.deleteMany({
        where: { offerCardId: id }
      });

      console.log('DELETE: Ana teklif siliniyor');
      await tx.offerCards.delete({
        where: { id }
      });
    });

    console.log('DELETE: Teklif başarıyla silindi');
    return new NextResponse(null, { status: 204 });
    
  } catch (error: any) {
    console.error('DELETE: Teklif silme hatası:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return new NextResponse("Teklif silinirken bir hata oluştu", { status: 500 });
  }
}