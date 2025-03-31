import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');

    if (!countryId) {
      return new NextResponse("Ülke ID parametresi gereklidir", { status: 400 });
    }

    const cities = await prisma.city.findMany({
      where: {
        countryId: countryId
      },
      select: {
        id: true,
        name: true,
        countryId: true
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("[CITIES_GET]", error);
    return new NextResponse("Şehirler getirilirken bir hata oluştu", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, countryId } = body;

    if (!name || !countryId) {
      return new NextResponse("Şehir adı ve ülke ID zorunludur", { status: 400 });
    }

    // Ülkenin var olup olmadığını kontrol et
    const countryExists = await prisma.country.findUnique({
      where: { id: countryId }
    });

    if (!countryExists) {
      return new NextResponse("Belirtilen ülke bulunamadı", { status: 404 });
    }

    const city = await prisma.city.create({
      data: {
        name,
        country: {
          connect: {
            id: countryId
          }
        }
      },
    });

    return NextResponse.json(city);
  } catch (error) {
    console.error("[CITIES_POST]", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Şehir oluşturulurken bir hata oluştu", { status: 500 });
  }
}