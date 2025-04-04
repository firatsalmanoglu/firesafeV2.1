// app/api/devices/filter-options/route.ts

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

    // Cihaz türlerini getir
    const deviceTypes = await prisma.deviceTypes.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Cihaz özelliklerini getir
    const deviceFeatures = await prisma.deviceFeatures.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Kurumları getir (ADMIN ise tüm kurumlar, değilse sadece kendi kurumu)
    let institutionsQuery = {};
    
    if (currentUser.role !== UserRole.ADMIN && currentUser.institutionId) {
      institutionsQuery = {
        id: currentUser.institutionId
      };
    }

    const institutions = await prisma.institutions.findMany({
      where: institutionsQuery,
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      deviceTypes,
      deviceFeatures,
      institutions,
      currentUserRole: currentUser.role
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}