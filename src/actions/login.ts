"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { redirect } from "next/navigation";

const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { email, password } = validatedFields.data;
  const user = await getUserByEmail(email);

  if (!user || !user.password) {
    return { error: "Invalid credentials!" };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Invalid credentials!" };
  }

  try {
    const verificationToken = await generateVerificationToken(email, "LOGIN");
    await sendVerificationEmail(email, verificationToken.token, "LOGIN");

    return { success: "Check your email for verification code!" };
  } catch (error) {
    return { error: "Something went wrong!" };
  }
};

export default login;
