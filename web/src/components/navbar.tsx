'use client';
import Link from "next/link";
import { Wand2, Menu, X, LogOut, User } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  // Main section pages
  const mainPages = [
    { href: "/audiences", label: "Audiences" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/ingest-data", label: "Ingest Data" },
    { href: "/api-docs", label: "API Documentation" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Smart-Sphere</span>
          </Link>
        </div>

        {/* Main Section Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {mainPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="text-sm font-medium px-3 py-2 rounded hover:bg-muted transition-colors"
            >
              {page.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer h-9 w-9 border">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                ) : (
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {session ? (
                <>
                  <div className="px-3 py-2">
                    <div className="font-medium">{session.user?.name || "User"}</div>
                    <div className="text-xs text-muted-foreground truncate">{session.user?.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex gap-2 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
                  >
                    Sign In
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
                  >
                    Sign Up
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
          <div className="flex flex-col gap-2">
            {mainPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="block text-base font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {page.label}
              </Link>
            ))}
          </div>
          <div className="border-t pt-4 flex flex-col gap-2">
            {/* Avatar Dropdown for Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-9 w-9 border">
                  {session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {session ? (
                  <>
                    <div className="px-3 py-2">
                      <div className="font-medium">{session.user?.name || "User"}</div>
                      <div className="text-xs text-muted-foreground truncate">{session.user?.email}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex gap-2 cursor-pointer"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signIn(undefined, { callbackUrl: "/dashboard" });
                      }}
                    >
                      Sign In
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signIn(undefined, { callbackUrl: "/dashboard" });
                      }}
                    >
                      Sign Up
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </header>
  );
}