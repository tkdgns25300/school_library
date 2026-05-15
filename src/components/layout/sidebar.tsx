"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  LayoutGrid,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { signOut } from "./sign-out-action";

const NAV_GROUPS = [
  {
    label: "운영",
    items: [
      { href: "/", label: "운영 화면", icon: LayoutGrid },
      { href: "/loans", label: "모니터링", icon: Activity },
    ],
  },
  {
    label: "관리",
    items: [
      { href: "/students", label: "학생", icon: Users },
      { href: "/books", label: "책", icon: BookOpen },
      { href: "/teachers", label: "교사", icon: User },
    ],
  },
] as const;

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          더힘
        </span>
        <div>
          <div className="text-sm font-semibold">School Library</div>
          <div className="text-xs text-sidebar-foreground/60">
            더힘스쿨 수지점
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </div>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            관
          </span>
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-medium">관리자 계정</div>
            <div className="truncate text-sidebar-foreground/60">{email}</div>
          </div>
        </div>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="text-xs text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
          >
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
