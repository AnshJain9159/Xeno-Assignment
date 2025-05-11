'use client';

import { usePathname } from 'next/navigation';
import {Navbar} from "@/components/navbar";
import {Footer} from "@/components/footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = ['/sign-in', '/sign-up','/too-fast'].includes(pathname);
  const hideFoot = ['/sign-in', '/sign-up','/too-fast'].includes(pathname);

  return (
    <>
      {!hideNav && <Navbar />}
      {children}
      {!hideFoot && <Footer/>}
    </>
  );
}