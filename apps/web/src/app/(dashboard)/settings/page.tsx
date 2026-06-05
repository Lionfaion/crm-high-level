import type { Metadata } from "next";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Account Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your business profile, branding and notification preferences.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
