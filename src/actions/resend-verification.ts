"use server";

import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { getUserByEmail } from "@/data/user";

export const resendVerificationEmail = async (
  email: string,
  type: "REGISTER" | "LOGIN"
) => {
  try {
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      return { error: "Email does not exist!" };
    }

    const verificationToken = await generateVerificationToken(email, type);
    await sendVerificationEmail(email, verificationToken.token, type);

    return { success: "Verification email sent!" };
  } catch (error) {
    return { error: "Something went wrong!" };
  }
};