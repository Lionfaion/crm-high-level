"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Send, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  type: "EMAIL" | "SMS";
  status: string;
  createdAt: string;
  sentAt: string | null;
  _count: { recipients: number };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:   "bg-gray-100 text-gray-700",
  SENDING: "bg-yellow-100 text-yellow-700",
  SENT:    "bg-green-100 text-green-700",
  FAILED:  "bg-red-100 text-red-700",
};

export function CampaignsClient() {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({
    name: "", type: "EMAIL" as "EMAIL" | "SMS",
    subject: "", body: "", fromName: "", fromEmail: "", fromPhone: "",
  });
  const [saving, setSaving]   = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const { data, mutate } = useSWR<{ campaigns: Campaign[]; total: number }>(
    "/v1/campaigns?pageSize=50"
  );

  const campaigns = data?.campaigns ?? [];

  async function createCampaign() {
    setSaving(true);
    try {
      await api.post("/v1/campaigns", form);
      toast.success("Campaign created");
      setOpen(false);
      setForm({ name: "", type: "EMAIL", subject: "", body: "", fromName: "", fromEmail: "", fromPhone: "" });
      mutate();
    } catch {
      toast.error("Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  async function sendCampaign(id: string) {
    setSending(id);
    try {
      const result = await api.post<{ sent: number }>(`/v1/campaigns/${id}/send`, {});
      toast.success(`Sent to ${result.sent} recipients`);
      mutate();
    } catch {
      toast.error("Failed to send campaign");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">{data?.total ?? 0} total campaigns</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "EMAIL" | "SMS" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "EMAIL" && (
                <>
                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label>From Name</Label>
                      <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>From Email</Label>
                      <Input type="email" value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
              {form.type === "SMS" && (
                <div className="grid gap-2">
                  <Label>From Phone</Label>
                  <Input value={form.fromPhone} onChange={(e) => setForm({ ...form, fromPhone: e.target.value })} placeholder="+1234567890" />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Message Body</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} placeholder="Hi {{firstName}}, …" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createCampaign} disabled={saving || !form.name || !form.body}>
                  {saving ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Megaphone className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm">Create your first email or SMS campaign.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ""}`}>
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell>{c._count.recipients}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {c.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendCampaign(c.id)}
                        disabled={sending === c.id}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        {sending === c.id ? "Sending…" : "Send"}
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
