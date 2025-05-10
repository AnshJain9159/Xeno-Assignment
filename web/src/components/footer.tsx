import { Wand2 } from "lucide-react";
import Link from "next/link"; // Assuming you're using Next.js; remove if not

export function Footer() {
  return (
    <footer className="border-t py-4 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Xeno-CRM</span>
          </div>

          {/* Social Links */}
          <div className="flex space-x-6">
            <Link
              href="https://github.com/AnshJain9159/Xeno-Assignment"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://www.linkedin.com/in/ansh-jain-78986b242/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              LinkedIn
            </Link>
            <Link
              href="https://x.com/whoanshjain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Twitter
            </Link>
          </div>

          <div className="text-sm text-muted-foreground">
            Powered by Groq API (Fast AI Inference) • © {new Date().getFullYear()} Xeno-CRM • Made with ❤️ by Ansh Jain
          </div>
        </div>
      </div>
    </footer>
  );
} 