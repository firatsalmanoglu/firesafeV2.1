// app/api/notificationTypes/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.notificationTypes.findMany({
      orderBy: {
        name: 'asc'  // İsimlere göre alfabetik sıralama
      }
    });

    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching notification types:', error);
    return NextResponse.json(
      { error: 'Bildirim türleri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'İsim alanı zorunludur' },
        { status: 400 }
      );
    }

    const type = await prisma.notificationTypes.create({
      data: {
        name
      }
    });

    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    console.error('Error creating notification type:', error);
    return NextResponse.json(
      { error: 'Bildirim türü oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}