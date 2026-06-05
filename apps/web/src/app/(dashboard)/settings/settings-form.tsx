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
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* ── General ─────────────────────────────────────────────────── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Info</CardTitle>
              <CardDescription>Your primary business details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Business name</Label>
                  <Input
                    value={settings.businessName ?? ""}
                    onChange={(e) => set("businessName", e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Support email</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail ?? ""}
                    onChange={(e) => set("supportEmail", e.target.value)}
                    placeholder="hello@acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Support phone</Label>
                  <Input
                    value={settings.supportPhone ?? ""}
                    onChange={(e) => set("supportPhone", e.target.value)}
                    placeholder="+1-555-0100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input
                    value={settings.currency ?? "USD"}
                    onChange={(e) => set("currency", e.target.value)}
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Timezone</Label>
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
              <CardTitle className="text-base">Branding</CardTitle>
              <CardDescription>Logo, favicon and brand colors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input
                  value={settings.logoUrl ?? ""}
                  onChange={(e) => set("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Favicon URL</Label>
                <Input
                  value={(settings as any).faviconUrl ?? ""}
                  onChange={(e) => set("faviconUrl" as any, e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary color</Label>
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
                  <Label>Secondary color</Label>
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
              <CardTitle className="text-base">Social Links</CardTitle>
              <CardDescription>Connect your social media profiles.</CardDescription>
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
              <CardTitle className="text-base">Business Address</CardTitle>
              <CardDescription>Physical location of your business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Street address</Label>
                <Input
                  value={settings.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={settings.city ?? ""} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>State / Province</Label>
                  <Input value={settings.state ?? ""} onChange={(e) => set("state", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>ZIP / Postal code</Label>
                  <Input value={settings.zipCode ?? ""} onChange={(e) => set("zipCode", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
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
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Choose how you receive alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications ?? true}
                  onCheckedChange={(v) => set("emailNotifications", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">SMS notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via SMS</p>
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
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && <span className="text-sm text-green-600">Settings saved.</span>}
      </div>
    </div>
  );
}
