import type { Metadata } from "next";
import { MembershipsClient } from "./memberships-client";

export const metadata: Metadata = { title: "Membresías" };

export default function MembershipsPage() {
  return <MembershipsClient />;
}
