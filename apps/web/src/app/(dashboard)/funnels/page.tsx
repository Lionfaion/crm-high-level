import type { Metadata } from "next";
import { FunnelsClient } from "./funnels-client";

export const metadata: Metadata = { title: "Embudos y Sitios Web" };

export default function FunnelsPage() {
  return <FunnelsClient />;
}
