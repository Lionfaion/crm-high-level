"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Play, Pause, Zap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Workflow {
  id: string;
  name: string;
  triggerType: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  createdAt: string;
  _count: { steps: number; runs: number };
}

const TRIGGER_TYPES = [
  "CONTACT_CREATED", "CONTACT_UPDATED", "TAG_ADDED", "TAG_REMOVED",
  "FORM_SUBMITTED", "APPOINTMENT_BOOKED", "OPPORTUNITY_CREATED",
  "OPPORTUNITY_WON", "OPPORTUNITY_LOST", "INBOUND_MESSAGE", "MANUAL",
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    "bg-gray-100 text-gray-700",
  ACTIVE:   "bg-green-100 text-green-700",
  PAUSED:   "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-red-100 text-red-700",
};

export function WorkflowsClient() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", triggerType: "CONTACT_CREATED" });
  const [saving, setSaving] = useState(false);

  const { data, mutate } = useSWR<{ workflows: Workflow[]; total: number }>(
    "/v1/workflows?pageSize=50"
  );

  const workflows = data?.workflows ?? [];

  async function createWorkflow() {
    setSaving(true);
    try {
      await api.post("/v1/workflows", form);
      toast.success("Workflow created");
      setOpen(false);
      setForm({ name: "", triggerType: "CONTACT_CREATED" });
      mutate();
    } catch {
      toast.error("Failed to create workflow");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(wf: Workflow) {
    const newStatus = wf.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await api.patch(`/v1/workflows/${wf.id}`, { status: newStatus });
      toast.success(`Workflow ${newStatus === "ACTIVE" ? "activated" : "paused"}`);
      mutate();
    } catch {
      toast.error("Failed to update workflow");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">{data?.total ?? 0} automation workflows</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Workflow</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Welcome new contact"
                />
              </div>
              <div className="grid gap-2">
                <Label>Trigger</Label>
                <Select
                  value={form.triggerType}
                  onValueChange={(v) => setForm({ ...form, triggerType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createWorkflow} disabled={saving || !form.name}>
                  {saving ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workflows.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Zap className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">No workflows yet</p>
          <p className="text-sm">Automate your CRM with trigger-based workflows.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((wf) => (
                <TableRow key={wf.id}>
                  <TableCell>
                    <Link href={`/workflows/${wf.id}`} className="font-medium hover:underline">
                      {wf.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {wf.triggerType.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[wf.status] ?? ""}`}>
                      {wf.status}
                    </span>
                  </TableCell>
                  <TableCell>{wf._count.steps}</TableCell>
                  <TableCell>{wf._count.runs}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(wf.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {wf.status !== "ARCHIVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(wf)}
                      >
                        {wf.status === "ACTIVE" ? (
                          <><Pause className="mr-1 h-3 w-3" />Pause</>
                        ) : (
                          <><Play className="mr-1 h-3 w-3" />Activate</>
                        )}
                      </Button>
                    )}
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
