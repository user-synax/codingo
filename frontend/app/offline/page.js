import { OfflineView } from "@/components/pwa/OfflineView";

export const metadata = {
  title: { absolute: "Offline — Codingo" },
  robots: { index: false, follow: false },
};

/* Served from the service-worker cache when navigations fail offline. */
export default function OfflinePage() {
  return <OfflineView />;
}
