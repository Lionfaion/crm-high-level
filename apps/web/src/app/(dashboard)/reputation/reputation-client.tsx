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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewerName: string | null;
  source: string;
  status: string;
  response: string | null;
  reviewedAt: string;
  contact: { firstName: string; lastName: string | null } | null;
}

interface Stats {
  total: number;
  averageRating: number;
  byRating: Record<number, number>;
}

const SOURCE_COLORS: Record<string, string> = {
  GOOGLE:   "bg-blue-100 text-blue-700",
  FACEBOOK: "bg-indigo-100 text-indigo-700",
  YELP:     "bg-red-100 text-red-700",
  INTERNAL: "bg-gray-100 text-gray-700",
  OTHER:    "bg-gray-100 text-gray-700",
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("h-4 w-4", s <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200")}
        />
      ))}
    </div>
  );
}

export function ReputationClient() {
  const [respondTo, setRespondTo] = useState<Review | null>(null);
  const [response, setResponse]   = useState("");
  const [saving, setSaving]       = useState(false);

  const { data: statsData } = useSWR<Stats>(
    "/v1/reputation/stats",
    () => api.get("/v1/reputation/stats")
  );

  const { data: reviewsData, mutate } = useSWR<{ reviews: Review[] }>(
    "/v1/reputation/reviews?pageSize=50",
    () => api.get("/v1/reputation/reviews?pageSize=50")
  );

  const stats   = statsData;
  const reviews = reviewsData?.reviews ?? [];

  async function submitResponse() {
    if (!respondTo || !response.trim()) return;
    setSaving(true);
    try {
      await api.post(`/v1/reputation/reviews/${respondTo.id}/respond`, { response });
      toast.success("Response submitted");
      setRespondTo(null);
      setResponse("");
      mutate();
    } catch {
      toast.error("Failed to submit response");
    } finally {
      setSaving(false);
    }
  }

  async function hideReview(id: string) {
    try {
      await api.post(`/v1/reputation/reviews/${id}/hide`, {});
      toast.success("Review hidden");
      mutate();
    } catch {
      toast.error("Failed to hide review");
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reputation Management</h1>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold">{stats.averageRating}</span>
              <StarRating value={Math.round(stats.averageRating)} />
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Reviews</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">5-Star Reviews</p>
            <p className="text-3xl font-bold mt-1">{stats.byRating[5] ?? 0}</p>
          </div>
        </div>
      )}

      {/* Reviews table */}
      {reviews.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Star className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm">Send review requests to your contacts to start collecting feedback.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.reviewerName ?? (r.contact ? `${r.contact.firstName} ${r.contact.lastName ?? ""}` : "Anonymous")}
                  </TableCell>
                  <TableCell><StarRating value={r.rating} /></TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[r.source] ?? ""}`}>
                      {r.source}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {r.title && <p className="font-medium text-sm">{r.title}</p>}
                    {r.body && <p className="text-sm text-muted-foreground truncate">{r.body}</p>}
                    {r.response && (
                      <p className="text-xs text-blue-600 mt-1">✓ Responded</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(r.reviewedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!r.response && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setRespondTo(r); setResponse(""); }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" /> Reply
                        </Button>
                      )}
                      {r.status !== "HIDDEN" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => hideReview(r.id)}
                        >
                          Hide
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

      {/* Respond dialog */}
      <Dialog open={!!respondTo} onOpenChange={(o) => { if (!o) setRespondTo(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>
          {respondTo && (
            <div className="space-y-4 pt-2">
              <div className="border rounded p-3 bg-muted/50">
                <StarRating value={respondTo.rating} />
                {respondTo.title && <p className="font-medium mt-1">{respondTo.title}</p>}
                {respondTo.body && <p className="text-sm text-muted-foreground">{respondTo.body}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Your Response</Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  placeholder="Thank you for your feedback…"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRespondTo(null)}>Cancel</Button>
                <Button onClick={submitResponse} disabled={saving || !response.trim()}>
                  <Send className="mr-1 h-3 w-3" />
                  {saving ? "Sending…" : "Send Response"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
