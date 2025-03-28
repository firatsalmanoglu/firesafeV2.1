"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { DEFAULT_GUEST_REDIRECT } from "@/routes";

const Social = () => {
  const onClick =(provider: "google") => {
    signIn(provider, {
      callbackUrl: DEFAULT_GUEST_REDIRECT
    });
  };

  return (
    <div className='w-full items-center gap-x-32'>
        <Button 
        size="lg"
        className="w-full"
        variant="outline"
        onClick={() => onClick("google")}
      
        >
            <FcGoogle className="h-5 w-5"/>
        </Button>
    </div>
  )
}

export default Social;