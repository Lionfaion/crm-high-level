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
import { Plus, DollarSign, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  dueDate: string | null;
  contact: { firstName: string; lastName: string | null; email: string | null } | null;
  _count: { items: number };
}

interface Summary {
  totalRevenue: number;
  pendingRevenue: number;
  invoiceCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:   "bg-gray-100 text-gray-700",
  SENT:    "bg-blue-100 text-blue-700",
  PAID:    "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID:    "bg-gray-100 text-gray-500",
};

function formatCents(amount: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

export function PaymentsClient() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    contactId: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    taxRate: "0",
  });
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const { data: summaryData } = useSWR<Summary>(
    "/v1/payments/summary",
    () => api.get("/v1/payments/summary")
  );

  const { data, mutate } = useSWR<{ invoices: Invoice[]; total: number }>(
    "/v1/payments/invoices?pageSize=50",
    () => api.get("/v1/payments/invoices?pageSize=50")
  );

  const invoices = data?.invoices ?? [];
  const summary  = summaryData;

  async function createInvoice() {
    setSaving(true);
    try {
      await api.post("/v1/payments/invoices", {
        contactId: form.contactId || undefined,
        taxRate: Number(form.taxRate),
        items: [{
          description: form.description,
          quantity: Number(form.quantity),
          unitPrice: Math.round(Number(form.unitPrice) * 100),
        }],
      });
      toast.success("Invoice created");
      setOpen(false);
      setForm({ contactId: "", description: "", quantity: "1", unitPrice: "", taxRate: "0" });
      mutate();
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setSaving(false);
    }
  }

  async function sendInvoice(id: string) {
    setActing(id);
    try {
      await api.post(`/v1/payments/invoices/${id}/send`, {});
      toast.success("Invoice marked as sent");
      mutate();
    } catch {
      toast.error("Failed to send invoice");
    } finally {
      setActing(null);
    }
  }

  async function markPaid(id: string) {
    setActing(id);
    try {
      await api.post(`/v1/payments/invoices/${id}/pay`, {});
      toast.success("Invoice marked as paid");
      mutate();
    } catch {
      toast.error("Failed to mark invoice as paid");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">{data?.total ?? 0} invoices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Contact ID (optional)</Label>
                <Input value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} placeholder="UUID" />
              </div>
              <div className="grid gap-2">
                <Label>Item Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Service / product name" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Unit Price ($)</Label>
                  <Input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="99.00" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={createInvoice} disabled={saving || !form.description || !form.unitPrice}>
                  {saving ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{formatCents(summary.totalRevenue)}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{formatCents(summary.pendingRevenue)}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold mt-1">{summary.invoiceCount}</p>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <DollarSign className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">No invoices yet</p>
          <p className="text-sm">Create invoices and track payments from your contacts.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-medium">{inv.number}</TableCell>
                  <TableCell>
                    {inv.contact
                      ? `${inv.contact.firstName} ${inv.contact.lastName ?? ""}`
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? ""}`}>
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{formatCents(inv.total, inv.currency)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.dueDate ? formatDistanceToNow(new Date(inv.dueDate), { addSuffix: true }) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {inv.status === "DRAFT" && (
                        <Button size="sm" variant="outline" onClick={() => sendInvoice(inv.id)} disabled={acting === inv.id}>
                          <Send className="h-3 w-3 mr-1" />Send
                        </Button>
                      )}
                      {(inv.status === "SENT" || inv.status === "OVERDUE") && (
                        <Button size="sm" variant="outline" onClick={() => markPaid(inv.id)} disabled={acting === inv.id}>
                          <CheckCircle className="h-3 w-3 mr-1" />Paid
                        </Button>
                      )}
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
