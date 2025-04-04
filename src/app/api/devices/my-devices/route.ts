// app/api/devices/my-devices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { UserRole, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 10; // Sayfa başına gösterilecek öğe sayısı
    const search = searchParams.get('search') || '';
    const typeId = searchParams.get('typeId');
    const featureId = searchParams.get('featureId');
    const ownerInstId = searchParams.get('ownerInstId');
    const currentStatus = searchParams.get('currentStatus');
    const lastControlDateFrom = searchParams.get('lastControlDateFrom');
    const lastControlDateTo = searchParams.get('lastControlDateTo');
    const expirationDateFrom = searchParams.get('expirationDateFrom');
    const expirationDateTo = searchParams.get('expirationDateTo');
    const sort = searchParams.get('sort') || 'serialNumber';
    const order = searchParams.get('order') || 'asc';

    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        institutionId: true 
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.role === UserRole.MUSTERI_SEVIYE1 && !currentUser.institutionId) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    let query: Prisma.DevicesWhereInput = {};

    // ADMIN değilse, role göre filtreleme yap
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.role === UserRole.MUSTERI_SEVIYE1 ||
          currentUser.role === UserRole.MUSTERI_SEVIYE2) {
        query.ownerId = session.user.id;
      } else if (currentUser.role === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
                 currentUser.role === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
        query.providerId = session.user.id;
      }
    }

    // Arama filtresi
    if (search) {
      query.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { qrcode: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { location1: { contains: search, mode: 'insensitive' } },
        { 
          type: { 
            name: { contains: search, mode: 'insensitive' } 
          } 
        },
        { 
          feature: { 
            name: { contains: search, mode: 'insensitive' } 
          } 
        },
        { 
          ownerIns: { 
            name: { contains: search, mode: 'insensitive' } 
          } 
        }
      ];
    }

    // Cihaz tipi filtresi
    if (typeId) {
      query.typeId = typeId;
    }

    // Cihaz özelliği filtresi
    if (featureId) {
      query.featureId = featureId;
    }

    // Kurum filtresi
    if (ownerInstId) {
      query.ownerInstId = ownerInstId;
    }

    // Durum filtresi
    if (currentStatus) {
      query.currentStatus = currentStatus as any;
    }

    // Son kontrol tarihi aralığı filtresi
    if (lastControlDateFrom || lastControlDateTo) {
      query.lastControlDate = {};
      
      if (lastControlDateFrom) {
        query.lastControlDate.gte = new Date(lastControlDateFrom);
      }
      
      if (lastControlDateTo) {
        query.lastControlDate.lte = new Date(lastControlDateTo);
      }
    }

    // Son kullanma tarihi aralığı filtresi
    if (expirationDateFrom || expirationDateTo) {
      query.expirationDate = {};
      
      if (expirationDateFrom) {
        query.expirationDate.gte = new Date(expirationDateFrom);
      }
      
      if (expirationDateTo) {
        query.expirationDate.lte = new Date(expirationDateTo);
      }
    }

    // Dinamik sıralama için orderBy nesnesini oluştur
    let orderBy: any = {};

    // Özel alanlara göre sıralama mantığı
    if (sort === 'type') {
      orderBy = {
        type: {
          name: order
        }
      };
    } else if (sort === 'feature') {
      orderBy = {
        feature: {
          name: order
        }
      };
    } else if (sort === 'ownerIns') {
      orderBy = {
        ownerIns: {
          name: order
        }
      };
    } else {
      // Diğer alanlar için doğrudan sıralama
      orderBy[sort] = order;
    }

    const [devices, count] = await prisma.$transaction([
      prisma.devices.findMany({
        where: query,
        include: {
          type: true,
          feature: true,
          owner: true,
          ownerIns: true,
          isgMember: true,
          provider: true,
          providerIns: true
        },
        orderBy: orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.devices.count({ where: query })
    ]);

    // Gereksiz veri göndermeyi önlemek için cihaz verilerini işleyelim
    const sanitizedDevices = devices.map(device => ({
      id: device.id,
      serialNumber: device.serialNumber,
      photo: device.photo,
      lastControlDate: device.lastControlDate.toISOString(),
      nextControlDate: device.nextControlDate.toISOString(),
      expirationDate: device.expirationDate.toISOString(),
      currentStatus: device.currentStatus,
      ownerId: device.ownerId,
      providerId: device.providerId,
      type: {
        id: device.type.id,
        name: device.type.name
      },
      feature: {
        id: device.feature.id,
        name: device.feature.name
      },
      owner: {
        id: device.owner.id,
        name: device.owner.name
      },
      ownerIns: {
        id: device.ownerIns.id,
        name: device.ownerIns.name
      },
      isgMember: device.isgMember ? {
        id: device.isgMember.id,
        name: device.isgMember.name
      } : null
    }));

    return NextResponse.json({
      devices: sanitizedDevices,
      count,
      currentUserRole: currentUser.role,
      currentUserId: session.user.id
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}