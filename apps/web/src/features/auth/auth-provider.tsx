"use client";

import { startTransition, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { registerUnauthorizedHandler } from "./api-client";
import { LOGIN_ROUTE } from "./auth-routes";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      if (pathname !== LOGIN_ROUTE) {
        startTransition(() => {
          router.replace(LOGIN_ROUTE);
        });
      }
    });
  }, [pathname, router]);

  return <>{children}</>;
}
