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
    <div className="flex min-h-screen bg-background">
      <Suspense>
        <Sidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <Toaster />
    </div>
  );
}
