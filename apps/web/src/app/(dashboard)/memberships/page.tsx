import type { Metadata } from "next";
import { MembershipsClient } from "./memberships-client";

export const metadata: Metadata = { title: "Memberships" };

export default function MembershipsPage() {
  return <MembershipsClient />;
}
