"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Funnel,
  Star,
  GraduationCap,
  CreditCard,
  Settings,
  GitBranch,
  Target,
  FileText,
  Activity,
  Building2,
  ChevronDown,
  ChevronRight,
  Megaphone,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string }[];
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        href: "/contacts",
        label: "Contacts",
        icon: Users,
        children: [
          { href: "/contacts",       label: "All Contacts" },
          { href: "/contacts/lists", label: "Lists & Segments" },
        ],
      },
      {
        href: "/pipelines",
        label: "Pipelines",
        icon: GitBranch,
        children: [
          { href: "/pipelines",             label: "All Pipelines" },
          { href: "/pipelines/opportunities", label: "Opportunities" },
        ],
      },
      { href: "/activities", label: "Activities", icon: Activity },
      { href: "/notes",      label: "Notes",      icon: FileText },
    ],
  },
  {
    title: "Messaging",
    items: [
      {
        href: "/messaging",
        label: "Conversations",
        icon: MessageSquare,
        children: [
          { href: "/messaging/inbox",    label: "Inbox" },
          { href: "/messaging/email",    label: "Email" },
          { href: "/messaging/sms",      label: "SMS" },
          { href: "/messaging/voicemail",label: "Voicemail" },
        ],
      },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/funnels",       label: "Funnels & Websites", icon: Funnel },
      { href: "/calendar",      label: "Calendar",           icon: Calendar },
      { href: "/reputation",    label: "Reputation",         icon: Star },
      { href: "/reporting",     label: "Reporting",          icon: BarChart3 },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/memberships", label: "Memberships", icon: GraduationCap },
      { href: "/payments",    label: "Payments",    icon: CreditCard },
    ],
  },
];

const bottomItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavItemRow({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            isActive
              ? "text-sidebar-foreground font-medium"
              : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? (
            <ChevronDown className="h-3 w-3 text-sidebar-foreground/40" />
          ) : (
            <ChevronRight className="h-3 w-3 text-sidebar-foreground/40" />
          )}
        </button>
        {open && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center rounded-md px-2 py-1.5 text-xs transition-colors",
                  pathname === child.href
                    ? "text-primary font-medium"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground",
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/20 text-primary font-medium"
          : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Building2 className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">CRM High Level</span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemRow key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Bottom */}
      <nav className="py-3 px-2 space-y-0.5">
        {bottomItems.map((item) => (
          <NavItemRow key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
