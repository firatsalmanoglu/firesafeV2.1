import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');

    if (!cityId) {
      return new NextResponse("Şehir ID parametresi gereklidir", { status: 400 });
    }

    const districts = await prisma.district.findMany({
      where: {
        cityId: cityId
      },
      select: {
        id: true,
        name: true,
        cityId: true
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(districts);
  } catch (error) {
    console.error("[DISTRICTS_GET]", error);
    return new NextResponse("İlçeler getirilirken bir hata oluştu", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cityId } = body;

    if (!name || !cityId) {
      return new NextResponse("İlçe adı ve şehir ID zorunludur", { status: 400 });
    }

    // Şehrin var olup olmadığını kontrol et
    const cityExists = await prisma.city.findUnique({
      where: { id: cityId }
    });

    if (!cityExists) {
      return new NextResponse("Belirtilen şehir bulunamadı", { status: 404 });
    }

    const district = await prisma.district.create({
      data: {
        name,
        city: {
          connect: {
            id: cityId
          }
        }
      },
    });

    return NextResponse.json(district);
  } catch (error) {
    console.error("[DISTRICTS_POST]", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("İlçe oluşturulurken bir hata oluştu", { status: 500 });
  }
}