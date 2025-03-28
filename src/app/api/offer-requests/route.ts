import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Transaction ile kayıt işlemi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ana teklif talebini oluştur
      const offerRequest = await tx.offerRequests.create({
        data: {
          start: new Date(body.start),
          end: new Date(body.end),
          status: "Beklemede",
          details: body.details,
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
        },
      });

      // 2. Alt kalemleri oluştur
      const requestSubPromises = body.requestSub.map((sub: any) =>
        tx.requestSub.create({
          data: {
            requiredDate: new Date(sub.requiredDate),
            serviceId: sub.serviceId,
            quantity: sub.quantity,
            detail: sub.detail,
            offerRequestId: offerRequest.id,
          },
        })
      );

      await Promise.all(requestSubPromises);

      // 3. Duyuru oluştur
      const announcement = await tx.announcements.create({
        data: {
          title: "Yeni Teklif Talebi",
          description: `${body.details} (Talep ID: ${offerRequest.id})`,
          date: new Date(),
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
        }
      });

      return {
        offerRequest,
        announcement
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Teklif talebi oluşturma hatası:', error);
    return new NextResponse('Teklif talebi oluşturulurken bir hata oluştu', { status: 500 });
  }
}

// GET metodu değişmedi
export async function GET() {
  try {
    const offerRequests = await prisma.offerRequests.findMany({
      include: {
        creator: true,
        creatorIns: true,
        RequestSub: {
          include: {
            service: true
          }
        }
      }
    });

    return NextResponse.json(offerRequests);
  } catch (error) {
    console.error('Teklif talepleri getirme hatası:', error);
    return new NextResponse('Teklif talepleri alınırken bir hata oluştu', { status: 500 });
  }
}