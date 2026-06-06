"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogOut, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":    "Panel",
  "/contacts":     "Contactos",
  "/pipelines":    "Embudos de venta",
  "/activities":   "Actividades",
  "/notes":        "Notas",
  "/messaging":    "Conversaciones",
  "/campaigns":    "Campañas",
  "/funnels":      "Embudos y Sitios Web",
  "/calendar":     "Calendario",
  "/reputation":   "Reputación",
  "/reporting":    "Reportes",
  "/memberships":  "Membresías",
  "/payments":     "Pagos",
  "/settings":     "Configuración",
};

function usePageTitle() {
  const pathname = usePathname();
  // Match longest prefix
  const match = Object.keys(ROUTE_LABELS)
    .filter((k) => pathname === k || pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_LABELS[match] : "CRM High Level";
}

export function Header() {
  const { data: session } = useSession();
  const title = usePageTitle();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <h1 className="text-sm font-semibold">{title}</h1>

      {/* Global search */}
      <div className="hidden md:flex items-center relative mx-4 flex-1 max-w-xs">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar…" className="pl-8 h-8 text-sm" />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell placeholder */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" title="Notificaciones">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
            0
          </Badge>
        </Button>

        <div className="flex items-center gap-2 pl-2 border-l">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-xs font-medium leading-none">{session?.user?.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{session?.user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-1"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
