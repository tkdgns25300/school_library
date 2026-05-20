"use client";

import Image from "next/image";
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
  Menu,
  User,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { signOut } from "./sign-out-action";

const COLLAPSED_KEY = "sidebar_collapsed";
const ADMIN_LABEL = "관리자";

const NAV_GROUPS = [
  {
    label: "운영",
    items: [
      { href: "/", label: "대여 데스크", icon: LayoutGrid },
      { href: "/loans", label: "대여 현황", icon: Activity },
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

export function Sidebar() {
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
        "hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:sticky md:top-0 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <SidebarBody
        collapsed={collapsed}
        hydrated={hydrated}
        onToggle={toggle}
      />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "md:hidden",
        )}
        aria-label="메뉴 열기"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-r-0 bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">메뉴</SheetTitle>
        <SidebarBody collapsed={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function SidebarBody({
  collapsed,
  hydrated,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  hydrated?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <Image
          src="/branding/hims-shield.png"
          alt="HIMS"
          width={36}
          height={37}
          priority
          className="size-9 shrink-0 object-contain"
        />
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
                      onClick={onNavigate}
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
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-badge text-sm font-semibold text-sidebar-primary-foreground">
              관
            </span>
            <div className="min-w-0 flex-1 text-xs">
              <div className="truncate font-medium">관리자 계정</div>
              <div className="truncate text-sidebar-foreground/60">
                {ADMIN_LABEL}
              </div>
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
        {onToggle && hydrated ? (
          <button
            type="button"
            onClick={onToggle}
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
    </div>
  );
}
