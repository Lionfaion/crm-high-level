"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface FunnelItem {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: { pages: number };
}

export function FunnelsClient() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", domain: "" });
  const [saving, setSaving] = useState(false);

  const { data, mutate } = useSWR<{ funnels: FunnelItem[] }>(
    "/v1/funnels"
  );

  const funnels = data?.funnels ?? [];

  async function create() {
    setSaving(true);
    try {
      await api.post("/v1/funnels", { ...form, domain: form.domain || undefined });
      toast.success("Funnel created");
      setOpen(false);
      setForm({ name: "", description: "", domain: "" });
      mutate();
    } catch {
      toast.error("Failed to create funnel");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Funnels & Websites</h1>
          <p className="text-muted-foreground">{funnels.length} funnels</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Funnel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Funnel</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lead Generation Funnel" />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Custom Domain (optional)</Label>
                <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="funnel.yourdomain.com" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create} disabled={saving || !form.name}>{saving ? "Creating…" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {funnels.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Filter className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">No funnels yet</p>
          <p className="text-sm">Build multi-step landing pages and capture leads.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnels.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link href={`/funnels/${f.id}`} className="font-medium hover:underline">{f.name}</Link>
                  </TableCell>
                  <TableCell>{f._count.pages}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${f.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {f.isActive ? "Active" : "Draft"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Link href={`/funnels/${f.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
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
