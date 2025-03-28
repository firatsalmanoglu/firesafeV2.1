// app/api/devices/my-devices/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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

    let query = {};

    // ADMIN değilse, role göre filtreleme yap
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.role === UserRole.MUSTERI_SEVIYE1 ||
          currentUser.role === UserRole.MUSTERI_SEVIYE2) {
        query = { ownerId: session.user.id };
      } else if (currentUser.role === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
                 currentUser.role === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
        query = { providerId: session.user.id };
      }
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
        }
      }),
      prisma.devices.count({ where: query })
    ]);

    // Gereksiz veri göndermeyi önlemek için cihaz verilerini işleyelim
    const sanitizedDevices = devices.map(device => ({
      id: device.id,
      serialNumber: device.serialNumber,
      photo: device.photo,
      lastControlDate: device.lastControlDate.toISOString(),
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
      }
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