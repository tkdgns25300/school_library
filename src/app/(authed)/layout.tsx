import Image from "next/image";
import { Suspense } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

export const preferredRegion = ["icn1"];

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen overflow-x-clip bg-background">
      <Suspense>
        <Sidebar />
      </Suspense>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none sticky top-0 -mb-[100vh] flex h-screen w-full items-center justify-center overflow-hidden"
        >
          <Image
            src="/branding/hims-shield.png"
            alt=""
            width={560}
            height={579}
            className="opacity-[0.07]"
          />
        </div>
        <div className="relative flex flex-1 flex-col">{children}</div>
      </div>
      <Toaster />
    </div>
  );
}
