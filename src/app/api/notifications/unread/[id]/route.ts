// app/api/notifications/unread/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Oturum kontrolü
    if (!session?.user) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const userId = params.id;

    // Kullanıcı bazlı erişim kontrolü (opsiyonel)
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bu bildirim verilerine erişim izniniz yok" },
        { status: 403 }
      );
    }

    // Okunmamış bildirimleri say
    const unreadNotifications = await prisma.notifications.count({
      where: {
        recipientId: userId,
        isRead: "Okunmadi", // Schema'nızdaki NotificationStatus enum değeri
      },
    });

    return NextResponse.json({ count: unreadNotifications });
  } catch (error) {
    console.error("[UNREAD_NOTIFICATIONS_GET]", error);
    return NextResponse.json(
      { 
        error: "Okunmamış bildirimler sayısı alınamadı",
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}