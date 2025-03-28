import { auth } from "@/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();

    if (session) {
      // Tüm auth cookie'lerini temizle
      const cookieStore = cookies();
      cookieStore.getAll().forEach((cookie) => {
        if (cookie.name.includes("auth")) {
          cookieStore.delete(cookie.name);
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SignOut API error:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
