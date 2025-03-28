// app/api/payment-terms/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const paymentTerms = await prisma.paymentTermTypes.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(paymentTerms);
    } catch (error) {
        console.log("[PAYMENT_TERMS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}