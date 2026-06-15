import type { Metadata } from "next";
import { StoreWalkthrough } from "@/components/store/StoreWalkthrough";

export const metadata: Metadata = {
  title: "The visit — chunkylabs",
  description: "Walk through the record store, station by station.",
};

export default function StorePage() {
  return <StoreWalkthrough />;
}
