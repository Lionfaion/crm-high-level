"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  price: number;
  createdAt: string;
  _count: { sections: number; enrollments: number };
}

function formatCents(amount: number) {
  return amount === 0 ? "Gratis" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" }).format(amount / 100);
}

export function MembershipsClient() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", description: "", price: "0" });
  const [saving, setSaving] = useState(false);

  const { data, mutate } = useSWR<{ courses: Course[] }>(
    "/v1/memberships/courses"
  );

  const courses = data?.courses ?? [];

  async function create() {
    setSaving(true);
    try {
      await api.post("/v1/memberships/courses", {
        ...form,
        price: Math.round(Number(form.price) * 100),
      });
      toast.success("Curso creado");
      setOpen(false);
      setForm({ title: "", slug: "", description: "", price: "0" });
      mutate();
    } catch {
      toast.error("Error al crear el curso");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(course: Course) {
    try {
      await api.patch(`/v1/memberships/courses/${course.id}`, { isPublished: !course.isPublished });
      toast.success(course.isPublished ? "Curso despublicado" : "Curso publicado");
      mutate();
    } catch {
      toast.error("Error al actualizar el curso");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Membresías y Cursos</h1>
          <p className="text-muted-foreground">{courses.length} cursos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo Curso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Curso</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ej. Dominio de Ventas 101" />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="dominio-ventas-101" />
              </div>
              <div className="grid gap-2">
                <Label>Descripción</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Precio ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={create} disabled={saving || !form.title || !form.slug}>{saving ? "Creando…" : "Crear"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <GraduationCap className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">Sin cursos aún</p>
          <p className="text-sm">Creá cursos en línea y gestioná las inscripciones.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Secciones</TableHead>
                <TableHead>Inscriptos</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/memberships/${c.id}`} className="font-medium hover:underline">{c.title}</Link>
                    <p className="text-xs text-muted-foreground">/{c.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isPublished ? "default" : "secondary"}>
                      {c.isPublished ? "Publicado" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCents(c.price)}</TableCell>
                  <TableCell>{c._count.sections}</TableCell>
                  <TableCell>{c._count.enrollments}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => togglePublish(c)}>
                        {c.isPublished ? "Despublicar" : "Publicar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
