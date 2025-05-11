import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

const Page = async () => {
  const session = await auth();
  if (session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
        <div className="glass-effect rounded-xl p-8 shadow-lg max-w-xl w-full flex flex-col items-center animate-fade-in">
          <h1 className="text-5xl font-bold text-primary mb-4 text-center">
            Whoa, Slow Down There, Speedy!
          </h1>
          <p className="mt-3 text-lg text-muted-foreground text-center">
            Looks like you&apos;ve been a little too eager. We&apos;ve put a
            temporary pause on your excitement. 🚦 Chill for a bit, and try again
            shortly.
          </p>
          <Link href="/" className="mt-6 w-full flex justify-center">
            <Button variant="outline" className="w-full sm:w-auto">
              <span className="font-semibold">Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="glass-effect rounded-xl p-8 shadow-lg max-w-xl w-full flex flex-col items-center animate-fade-in">
        <h1 className="text-5xl font-bold text-primary mb-4 text-center">
          Whoa, Slow Down There, Speedy!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground text-center">
          Looks like you&apos;ve been a little too eager. We&apos;ve put a
          temporary pause on your excitement. 🚦 Chill for a bit, and try again
          shortly.
        </p>
        <Link href="/sign-up" className="mt-6 w-full flex justify-center">
          <Button variant="outline" className="w-full sm:w-auto">
            <span className="font-semibold">Go to Signup</span>
          </Button>
        </Link>
      </div>
    </main>
  );
};

export default Page;