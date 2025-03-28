import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET() {
  try {
    // Tüm servisleri getir
    const services = await prisma.services.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Services fetch error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const service = await prisma.services.create({
      data: {
        name: body.name
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Service creation error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}