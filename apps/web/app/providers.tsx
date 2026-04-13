"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "../src/features/auth/auth-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
