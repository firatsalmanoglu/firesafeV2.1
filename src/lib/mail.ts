"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false, // SSL bağlantısını false yapıyoruz
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Self-signed sertifikaları kabul et
    minVersion: "TLSv1", // Minimum TLS versiyonunu belirt
  }
});

export const sendVerificationEmail = async (
  email: string, 
  token: string, 
  type: "REGISTER" | "LOGIN"
) => {
  try {
    console.log("Mail gönderiliyor:", {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      user: process.env.EMAIL_SERVER_USER
    });

    await transporter.sendMail({
      from: "noreply@firesafe.com.tr",
      to: email,
      subject: type === "REGISTER" ? "Email Verification" : "Login Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #333;">${type === "REGISTER" ? "Email Adresinizi Doğrulayın" : "Giriş Doğrulama Kodu"}</h1>
          <p style="font-size: 16px; color: #666;">Doğrulama kodunuz:</p>
          <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; color: #333; text-align: center;">${token}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Bu kod 4 dakika süreyle geçerlidir.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Email gönderme hatası:", error);
    return false;
  }
};