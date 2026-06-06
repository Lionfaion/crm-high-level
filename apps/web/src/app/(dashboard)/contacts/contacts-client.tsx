"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Search, Plus, Upload, Download, Loader2, UserCircle } from "lucide-react";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Contact = {
  id: string; firstName: string; lastName?: string; email?: string;
  phone?: string; company?: string; status: string; tags: string[]; createdAt: string;
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  LEAD: "secondary", PROSPECT: "warning", CUSTOMER: "success", CHURNED: "destructive",
};

export function ContactsClient() {
  const { activeAccount } = useAccount();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useSWR<{ contacts: Contact[]; total: number; totalPages: number }>(
    activeAccount ? `/v1/contacts?pageSize=50${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}` : null,
  );

  function handleSearch(v: string) {
    setSearch(v);
    clearTimeout((handleSearch as any).__t);
    (handleSearch as any).__t = setTimeout(() => setDebouncedSearch(v), 350);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contactos…"
            className="pl-8"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={`/api/contacts/export`} download>
              <Download className="h-4 w-4" /> Exportar
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo Contacto
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total} contact{data.total !== 1 ? "s" : ""}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando contactos…
        </div>
      ) : !data?.contacts.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <UserCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Sin contactos aún</p>
            <p className="text-sm text-muted-foreground">Agregá tu primer contacto para comenzar.</p>
            <Button size="sm" className="mt-2 gap-1.5"><Plus className="h-4 w-4" /> Nuevo Contacto</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Correo electrónico</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Empresa</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Etiquetas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.contacts.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${c.id}`} className="font-medium hover:text-primary transition-colors">
                      {c.firstName} {c.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground sm:hidden">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.company}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_COLORS[c.status] ?? "secondary"} className="text-xs">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
