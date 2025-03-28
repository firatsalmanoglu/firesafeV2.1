"use server";

import prisma from "@/lib/prisma";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data/user";

export const verifyToken = async (
  token: string, 
  type: "REGISTER" | "LOGIN"
) => {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return { error: "Invalid token!" };
    }

    if (verificationToken.expires < new Date()) {
      return { error: "Token has expired!" };
    }

    const user = await getUserByEmail(verificationToken.email);
    
    if (!user) {
      return { error: "User not found!" };
    }

    if (type === "REGISTER") {
      await prisma.user.update({
        where: { email: verificationToken.email },
        data: { emailVerified: new Date() }
      });
      
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });

      return { success: "Email verified! You can now login." };
    }

    if (type === "LOGIN") {
      try {
        // Token'ı silelim
        await prisma.emailVerificationToken.delete({
          where: { id: verificationToken.id }
        });
        
        // Session başlatma işlemini client tarafına bırakalım
        return { 
          success: "Verification successful!", 
          email: verificationToken.email,
          redirect: true 
        };
      } catch (error) {
        if (error instanceof AuthError) {
          return { error: "Invalid login!" };
        }
        throw error;
      }
    }

  } catch (error) {
    console.error("[VERIFY_TOKEN_ERROR]", error);
    return { error: "Something went wrong!" };
  }
};