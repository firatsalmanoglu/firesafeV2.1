"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyToken } from "@/actions/verify-token";
import { resendVerificationEmail } from "@/actions/resend-verification";
import CardWrapper from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormError from "@/components/form-error";
import FormSuccess from "@/components/form-success";
import { signIn } from "next-auth/react";
import { DEFAULT_GUEST_REDIRECT } from "@/routes";

const VerificationForm = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240);

  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const email = searchParams.get("email");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await verifyToken(code, type as "REGISTER" | "LOGIN");

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.success) {
        setSuccess(result.success);

        if (type === "LOGIN") {
          try {
            // Email ve kodu kullanarak direkt signIn yapalım
            const signInResult = await signIn("credentials", {
              email,
              password: code,
              redirect: false,
              callbackUrl: DEFAULT_GUEST_REDIRECT,
            });

            if (signInResult?.error) {
              setError("Failed to login!");
              return;
            }

            if (signInResult?.ok) {
              // Başarılı login sonrası admin sayfasına yönlendir
              setSuccess("Login successful! Redirecting...");
              setTimeout(() => {
                router.push(DEFAULT_GUEST_REDIRECT);
              }, 1000);
            }
          } catch (error) {
            console.error("SignIn error:", error);
            setError("Failed to login!");
          }
        }

        if (type === "REGISTER") {
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      }
    } catch (error) {
      setError("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) {
      setError("Email not found!");
      return;
    }

    try {
      const result = await resendVerificationEmail(
        email,
        type as "REGISTER" | "LOGIN"
      );
      if (result?.error) {
        setError(result.error);
      } else {
        setTimeLeft(240);
        setSuccess("New code sent!");
      }
    } catch (error) {
      setError("Failed to resend code");
    }
  };

  return (
    <CardWrapper
      headerLabel={
        type === "REGISTER" ? "Verify your email" : "Login verification"
      }
      backButtonLabel="Back to login"
      backButtonHref="/login"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter verification code"
            disabled={isLoading}
            maxLength={6}
          />
        </div>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Button
          disabled={isLoading || code.length !== 6}
          type="submit"
          className="w-full"
        >
          Verify
        </Button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Time remaining: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </p>
        {timeLeft === 0 && (
          <Button
            variant="link"
            onClick={onResend}
            disabled={isLoading}
            className="mt-2"
          >
            Resend code
          </Button>
        )}
      </div>
    </CardWrapper>
  );
};

export default VerificationForm;
