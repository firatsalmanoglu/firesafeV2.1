"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await signOut({
          redirect: false,
        });

        router.push("/");
      } catch (error) {
        router.push("/");
      }
    };

    doLogout();
  }, [router]);

  console.log("Rendering logout UI");

  return (
    <div className="flex justify-center items-center h-full">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Logging out...</h1>
        <p>Please wait while you are being signed out.</p>
      </div>
    </div>
  );
}
