import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        phoneCode: true
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error("[COUNTRIES_GET]", error);
    return new NextResponse("Ülkeler getirilirken bir hata oluştu", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, phoneCode } = body;

    if (!name) {
      return new NextResponse("Ülke adı zorunludur", { status: 400 });
    }

    const country = await prisma.country.create({
      data: {
        name,
        code,
        phoneCode,
      },
    });

    return NextResponse.json(country);
  } catch (error) {
    console.error("[COUNTRIES_POST]", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Ülke oluşturulurken bir hata oluştu", { status: 500 });
  }
}