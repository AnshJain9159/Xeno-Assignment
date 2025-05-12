import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
// import { auth } from "@/auth";
import ClientLayout from "@/components/ClientLayout";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart-Sphere",
  description: "Intelligent customer relationship management platform for the Xeno SDE Internship Assignment",
}

const RootLayout = async({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  // const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning={true}
     className='!scroll-smooth'>
      <SessionProvider >
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        > 
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ClientLayout>
              {children}
              <Toaster />
            </ClientLayout>
          </ThemeProvider>
        </body>
      </SessionProvider>
    </html>
  );
}

export default RootLayout;