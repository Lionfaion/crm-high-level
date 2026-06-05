import type { Metadata } from "next";
import { WorkflowDetailClient } from "./workflow-detail-client";

export const metadata: Metadata = { title: "Workflow Builder" };

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  return <WorkflowDetailClient id={params.id} />;
}
