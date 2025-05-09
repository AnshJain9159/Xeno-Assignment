'use client';
import Link from "next/link";
import { Wand2, ArrowRight, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Xeno-CRM</span>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {session ? (
            <>
              {/* <Link href="/history">
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </Link> */}
              <Link href="/dashboard">
                <Button size="sm" className="gap-2 hidden sm:flex">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
              >
                Sign Up
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-primary"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t py-4 px-6 space-y-4 animate-in slide-in-from-top-10 duration-200">
          <Link
            href="/"
            className="block text-base font-medium hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          {session ? (
            <>
              {/* <Link
                href="/history"
                className="block text-base font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                History
              </Link> */}
              <Link
                href="#"
                className="block text-base font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
              <button
                className="block text-base font-medium hover:text-primary transition-colors w-full text-left"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="block text-base font-medium hover:text-primary transition-colors w-full text-left"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signIn(undefined, { callbackUrl: "/dashboard" });
                }}
              >
                Sign In
              </button>
              <button
                className="block text-base font-medium hover:text-primary transition-colors w-full text-left"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signIn(undefined, { callbackUrl: "/dashboard" });
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}