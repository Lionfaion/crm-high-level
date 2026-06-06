import type { Metadata } from "next";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configuración de la cuenta</h2>
        <p className="text-sm text-muted-foreground">
          Gestioná el perfil de tu negocio, la marca y las preferencias de notificaciones.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
