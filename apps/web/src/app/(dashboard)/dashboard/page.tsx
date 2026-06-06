import type { Metadata } from "next";
import Link from "next/link";
import {
  Users, Target, GitBranch, TrendingUp,
  MessageSquare, Calendar, Star, CreditCard,
  Filter, GraduationCap, Megaphone, BarChart3,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Panel" };

const stats = [
  { label: "Total de Contactos",    icon: Users,       value: "—", badge: null },
  { label: "Oportunidades Abiertas", icon: Target,      value: "—", badge: null },
  { label: "Embudos Activos",        icon: GitBranch,   value: "—", badge: null },
  { label: "Ganados este Mes",       icon: TrendingUp,  value: "—", badge: null },
];

const modules = [
  {
    href: "/contacts",
    label: "Contactos",
    description: "Gestioná leads y clientes",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    href: "/pipelines",
    label: "Embudos de venta",
    description: "Seguí los negocios por etapas",
    icon: GitBranch,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    href: "/messaging/inbox",
    label: "Conversaciones",
    description: "Correo, SMS y correo de voz",
    icon: MessageSquare,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    href: "/calendar",
    label: "Calendario",
    description: "Agendá turnos y citas",
    icon: Calendar,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    href: "/funnels",
    label: "Embudos",
    description: "Construí páginas de aterrizaje y embudos",
    icon: Filter,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    href: "/reputation",
    label: "Reputación",
    description: "Gestioná reseñas y calificaciones",
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    href: "/campaigns",
    label: "Campañas",
    description: "Ejecutá campañas de marketing",
    icon: Megaphone,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    href: "/memberships",
    label: "Membresías",
    description: "Cursos y sitios de membresía",
    icon: GraduationCap,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    href: "/payments",
    label: "Pagos",
    description: "Facturas y transacciones",
    icon: CreditCard,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    href: "/reporting",
    label: "Reportes",
    description: "Analíticas e informes",
    icon: BarChart3,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, icon: Icon, value, badge }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-2xl font-bold">{value}</p>
              {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module grid */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Todos los módulos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map(({ href, label, description, icon: Icon, color, bg }) => (
            <Link key={href} href={href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${bg} shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
