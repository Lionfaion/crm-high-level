import type { Metadata } from "next";
import { PipelinesClient } from "./pipelines-client";

export const metadata: Metadata = { title: "Embudos de venta" };

export default function PipelinesPage() {
  return <PipelinesClient />;
}
