import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: true, // SSL için true
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    await transporter.sendMail({
      from: "firesafe@firesafe.com.tr",
      to,
      subject,
      html,
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email gönderme hatası:", error);
    return NextResponse.json(
      { error: "Email gönderilemedi" },
      { status: 500 }
    );
  }
}