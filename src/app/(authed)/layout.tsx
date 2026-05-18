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
        <Sidebar email="관리자" />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
      <Toaster />
    </div>
  );
}
