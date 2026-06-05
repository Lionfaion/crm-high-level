"use client";

import useSWR from "swr";
import { Users, DollarSign, MessageSquare, Calendar, Star, TrendingUp, BarChart3, Target } from "lucide-react";

interface DashboardStats {
  contacts:   { total: number; newThisMonth: number };
  pipeline:   { openOpportunities: number; wonValue: number };
  messaging:  { sentCampaigns: number; openConversations: number };
  calendar:   { scheduledAppointments: number };
  payments:   { totalRevenue: number };
  reputation: { averageRating: number };
}

interface GrowthPoint { date: string; count: number }
interface FunnelStage  { stage: string; count: number }
interface RevenueMonth { month: string; revenue: number }

function formatCents(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount / 100);
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="border rounded-lg p-5 flex gap-4 items-start">
      <div className={`p-2 rounded-lg ${color ?? "bg-primary/10"}`}>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-2 bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium w-8 text-right">{value}</span>
    </div>
  );
}

export function ReportingClient() {
  const { data: stats } = useSWR<DashboardStats>(
    "/v1/reporting/dashboard"
  );

  const { data: growth } = useSWR<{ data: GrowthPoint[] }>(
    "/v1/reporting/contacts/growth?days=30"
  );

  const { data: funnel } = useSWR<{ data: FunnelStage[] }>(
    "/v1/reporting/pipeline/funnel"
  );

  const { data: revenue } = useSWR<{ data: RevenueMonth[] }>(
    "/v1/reporting/revenue"
  );

  const maxFunnel = Math.max(...(funnel?.data ?? []).map((s) => s.count), 1);
  const maxRevenue = Math.max(...(revenue?.data ?? []).map((r) => r.revenue), 1);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reporting & Analytics</h1>
        <p className="text-muted-foreground">Business performance overview</p>
      </div>

      {/* KPI grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="Total Contacts"
            value={stats.contacts.total.toLocaleString()}
            sub={`+${stats.contacts.newThisMonth} this month`}
          />
          <StatCard
            icon={Target}
            label="Open Opportunities"
            value={stats.pipeline.openOpportunities}
            sub={`${formatCents(stats.pipeline.wonValue)} won`}
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={formatCents(stats.payments.totalRevenue)}
          />
          <StatCard
            icon={MessageSquare}
            label="Open Conversations"
            value={stats.messaging.openConversations}
            sub={`${stats.messaging.sentCampaigns} campaigns sent`}
          />
          <StatCard
            icon={Calendar}
            label="Scheduled Appointments"
            value={stats.calendar.scheduledAppointments}
          />
          <StatCard
            icon={Star}
            label="Avg. Rating"
            value={stats.reputation.averageRating > 0 ? `${stats.reputation.averageRating} ★` : "N/A"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact growth */}
        {growth?.data && growth.data.length > 0 && (
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Contact Growth (30 days)
            </h2>
            <div className="flex items-end gap-1 h-24">
              {growth.data.map((p) => {
                const maxCount = Math.max(...growth.data.map((d) => d.count), 1);
                const height   = Math.max((p.count / maxCount) * 100, p.count > 0 ? 10 : 0);
                return (
                  <div
                    key={p.date}
                    title={`${p.date}: ${p.count}`}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-sm transition-colors"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{growth.data[0]?.date?.slice(5)}</span>
              <span>{growth.data[growth.data.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
        )}

        {/* Pipeline funnel */}
        {funnel?.data && funnel.data.length > 0 && (
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Pipeline Funnel
            </h2>
            <div className="space-y-2">
              {funnel.data.map((s) => (
                <MiniBar key={s.stage} label={s.stage} value={s.count} max={maxFunnel} />
              ))}
            </div>
          </div>
        )}

        {/* Revenue by month */}
        {revenue?.data && revenue.data.length > 0 && (
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Revenue (6 months)
            </h2>
            <div className="space-y-2">
              {revenue.data.map((r) => (
                <MiniBar
                  key={r.month}
                  label={r.month}
                  value={Math.round(r.revenue / 100)}
                  max={Math.round(maxRevenue / 100)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Data Export</h2>
          <p className="text-sm text-muted-foreground mb-4">Download your data as CSV for analysis in Excel or Google Sheets.</p>
          <a href="/api/proxy/v1/reporting/contacts/export.csv" download>
            <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
              <Users className="h-4 w-4" /> Export Contacts CSV
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
