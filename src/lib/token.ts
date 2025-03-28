import prisma from "@/lib/prisma";
import crypto from "crypto";

export const generateVerificationToken = async (
  email: string, 
  type: "REGISTER" | "LOGIN"
) => {
  const token = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(new Date().getTime() + 4 * 60 * 1000); // 4 dakika

  const existingToken = await prisma.emailVerificationToken.findFirst({
    where: { email, type }
  });

  if (existingToken) {
    await prisma.emailVerificationToken.delete({
      where: { id: existingToken.id }
    });
  }

  const verificationToken = await prisma.emailVerificationToken.create({
    data: {
      email,
      token,
      expires,
      type
    }
  });

  return verificationToken;
};