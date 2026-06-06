"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2, Globe, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const STATUS_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  LEAD: "secondary", PROSPECT: "warning", CUSTOMER: "success", CHURNED: "destructive",
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSWR<{ contact: any }>(`/v1/contacts/${id}`);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-16 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando contacto…
      </div>
    );
  }

  const c = data?.contact;
  if (!c) return <p className="text-muted-foreground text-sm">Contacto no encontrado.</p>;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link href="/contacts" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Todos los contactos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{c.firstName} {c.lastName}</h2>
          {c.company && <p className="text-sm text-muted-foreground mt-0.5">{c.company}</p>}
        </div>
        <Badge variant={STATUS_COLORS[c.status] ?? "secondary"}>{c.status}</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Información de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {c.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${c.email}`} className="hover:text-foreground truncate">{c.email}</a>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${c.phone}`} className="hover:text-foreground">{c.phone}</a>
                </div>
              )}
              {c.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" /><span>{c.company}</span>
                </div>
              )}
              {c.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  <a href={c.website} target="_blank" rel="noreferrer" className="hover:text-foreground truncate">{c.website}</a>
                </div>
              )}
              {(c.city || c.country) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{[c.city, c.state, c.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {c.tags?.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Etiquetas</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {c.tags.map((t: string) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="notes">
            <TabsList>
              <TabsTrigger value="notes">Notas ({c.notes?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="opportunities">Oportunidades ({c.opportunities?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-3 mt-3">
              {!c.notes?.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin notas aún.</p>
              ) : (
                c.notes.map((n: any) => (
                  <Card key={n.id}>
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {n.author?.name} · {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-3 mt-3">
              {!c.opportunities?.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin oportunidades vinculadas.</p>
              ) : (
                c.opportunities.map((o: any) => (
                  <Card key={o.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{o.stage?.pipeline?.name} › {o.stage?.name}</p>
                      </div>
                      <div className="text-right">
                        {o.value && <p className="font-semibold text-sm">${Number(o.value).toLocaleString()}</p>}
                        <Badge variant={o.status === "WON" ? "success" : o.status === "LOST" ? "destructive" : "secondary"} className="text-xs mt-1">
                          {o.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-3">
              {!c.activities?.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin actividad registrada.</p>
              ) : (
                <div className="space-y-2">
                  {c.activities.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary/60 mt-2 shrink-0" />
                      <div>
                        <p className="font-medium">{a.type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
