"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`${API_URL}/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al registrarse");
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Empezá a gestionar tu CRM hoy</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" name="name" type="text" required value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <a href="/login" className="text-primary hover:underline font-medium">Iniciar sesión</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
