"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { signOut } from "./sign-out-action";

const COLLAPSED_KEY = "sidebar_collapsed";

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
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          더힘
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">School Library</div>
            <div className="truncate text-xs text-sidebar-foreground/60">
              더힘스쿨 수지점
            </div>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-hidden px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <div className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </div>
            ) : null}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        collapsed && "justify-center",
                        isActive
                          ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-1">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              관
            </span>
            <div className="min-w-0 flex-1 text-xs">
              <div className="truncate font-medium">관리자 계정</div>
              <div className="truncate text-sidebar-foreground/60">{email}</div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                title="로그아웃"
                className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        ) : (
          <form action={signOut}>
            <button
              type="submit"
              title="로그아웃"
              className="flex w-full items-center justify-center rounded-md py-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        )}
        {hydrated ? (
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? "사이드바 펼치기" : undefined}
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center",
            )}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
            {!collapsed ? <span>사이드바 접기</span> : null}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
