"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";

const register = async (values: z.infer<typeof RegisterSchema>) => {
  try {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid fields" };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Email kullanımda mı kontrol et
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { error: "Email already in use!" };
    }

    // Kullanıcıyı oluştur
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Verification token oluştur
    const verificationToken = await generateVerificationToken(email, "REGISTER");
    
    // Debug için log ekleyelim
    console.log("Generated verification token:", verificationToken.token);
    
    // Email gönder
    try {
      await sendVerificationEmail(
        email,
        verificationToken.token,
        "REGISTER"
      );
      
      return { 
        success: "Confirmation email sent!",
        email: email
      };
    } catch (error) {
      console.error("Failed to send email:", error);
      // Email gönderilemese bile kullanıcı oluşturuldu, bu yüzden success dönelim
      return { 
        success: "Account created! Proceeding to verification...",
        email: email
      };
    }

  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return { error: "Something went wrong!" };
  }
}

export default register;