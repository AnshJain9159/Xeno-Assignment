"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="glass-effect rounded-xl p-8 shadow-lg max-w-xl w-full flex flex-col items-center animate-fade-in">
        <h1 className="text-5xl font-bold text-primary mb-4 text-center">
          404 – Not Found
        </h1>
        <p className="mt-3 text-lg text-muted-foreground text-center">
          Could not find the requested resource.
        </p>
        <Link href="/" className="mt-6 w-full flex justify-center">
          <Button variant="outline" className="w-full sm:w-auto">
            <span className="font-semibold">Go Home</span>
          </Button>
        </Link>
      </div>
    </main>
  );
}