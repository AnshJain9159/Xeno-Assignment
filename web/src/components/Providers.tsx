"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import ClientLayout from "@/components/ClientLayout";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ClientLayout>
          {children}
          <Toaster />
        </ClientLayout>
      </ThemeProvider>
    </SessionProvider>
  );
}

//Not in use