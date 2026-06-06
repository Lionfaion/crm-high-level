"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";

type Settings = {
  businessName?: string;
  supportEmail?: string;
  supportPhone?: string;
  timezone?: string;
  currency?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
};

export function SettingsForm() {
  const { data: session } = useSession();
  const accountId = (session?.user as any)?.accountId as string | undefined;
  const token = (session?.user as any)?.accessToken as string | undefined;

  const { data, isLoading, mutate } = useSWR<{ settings: Settings }>(
    accountId ? `/v1/settings/accounts/${accountId}` : null,
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Settings>({});

  // Merge fetched settings into form once loaded
  const settings: Settings = { ...data?.settings, ...form };

  function set(key: keyof Settings, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!accountId || !token) return;
    setSaving(true);
    try {
      const updated = await api.patch<{ settings: Settings }>(
        `/v1/settings/accounts/${accountId}`,
        form,
        token,
      );
      await mutate({ settings: updated.settings }, false);
      setForm({});
      setSaved(true);
    } catch {
      // error handling can be improved with toast
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="social">Redes sociales</TabsTrigger>
          <TabsTrigger value="address">Dirección</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        {/* ── General ─────────────────────────────────────────────────── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del negocio</CardTitle>
              <CardDescription>Tus datos principales del negocio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre del negocio</Label>
                  <Input
                    value={settings.businessName ?? ""}
                    onChange={(e) => set("businessName", e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Correo de soporte</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail ?? ""}
                    onChange={(e) => set("supportEmail", e.target.value)}
                    placeholder="hello@acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono de soporte</Label>
                  <Input
                    value={settings.supportPhone ?? ""}
                    onChange={(e) => set("supportPhone", e.target.value)}
                    placeholder="+1-555-0100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <Input
                    value={settings.currency ?? "USD"}
                    onChange={(e) => set("currency", e.target.value)}
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Zona horaria</Label>
                  <Input
                    value={settings.timezone ?? "UTC"}
                    onChange={(e) => set("timezone", e.target.value)}
                    placeholder="America/New_York"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branding ────────────────────────────────────────────────── */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marca</CardTitle>
              <CardDescription>Logo, favicon y colores de la marca.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>URL del logo</Label>
                <Input
                  value={settings.logoUrl ?? ""}
                  onChange={(e) => set("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL del favicon</Label>
                <Input
                  value={(settings as any).faviconUrl ?? ""}
                  onChange={(e) => set("faviconUrl" as any, e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Color primario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor ?? "#6d28d9"}
                      onChange={(e) => set("primaryColor", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor ?? "#6d28d9"}
                      onChange={(e) => set("primaryColor", e.target.value)}
                      placeholder="#6d28d9"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Color secundario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.secondaryColor ?? "#4f46e5"}
                      onChange={(e) => set("secondaryColor", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.secondaryColor ?? "#4f46e5"}
                      onChange={(e) => set("secondaryColor", e.target.value)}
                      placeholder="#4f46e5"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Social ──────────────────────────────────────────────────── */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Redes sociales</CardTitle>
              <CardDescription>Conectá tus perfiles de redes sociales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: "facebookUrl",  label: "Facebook" },
                  { key: "instagramUrl", label: "Instagram" },
                  { key: "linkedinUrl",  label: "LinkedIn" },
                  { key: "twitterUrl",   label: "X / Twitter" },
                ] as { key: keyof Settings; label: string }[]
              ).map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={(settings[key] as string) ?? ""}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={`https://${label.toLowerCase().split(" ")[0]}.com/yourpage`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Address ─────────────────────────────────────────────────── */}
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dirección del negocio</CardTitle>
              <CardDescription>Ubicación física de tu negocio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Calle</Label>
                <Input
                  value={settings.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ciudad</Label>
                  <Input value={settings.city ?? ""} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Provincia / Estado</Label>
                  <Input value={settings.state ?? ""} onChange={(e) => set("state", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Código postal</Label>
                  <Input value={settings.zipCode ?? ""} onChange={(e) => set("zipCode", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>País</Label>
                  <Input value={settings.country ?? ""} onChange={(e) => set("country", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ────────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificaciones</CardTitle>
              <CardDescription>Elegí cómo recibir alertas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notificaciones por correo</p>
                  <p className="text-xs text-muted-foreground">Recibí actualizaciones por correo electrónico</p>
                </div>
                <Switch
                  checked={settings.emailNotifications ?? true}
                  onCheckedChange={(v) => set("emailNotifications", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notificaciones por SMS</p>
                  <p className="text-xs text-muted-foreground">Recibí actualizaciones por SMS</p>
                </div>
                <Switch
                  checked={settings.smsNotifications ?? false}
                  onCheckedChange={(v) => set("smsNotifications", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save bar */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving || !accountId} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        {saved && <span className="text-sm text-green-600">Configuración guardada.</span>}
      </div>
    </div>
  );
}
