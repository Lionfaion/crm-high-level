import type { Metadata } from "next";
import { ReportingClient } from "./reporting-client";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportingPage() {
  return <ReportingClient />;
}
