import { PlatformShell } from "@/components/shell/PlatformShell";
import { WorkspaceClient } from "@/components/workspace/WorkspaceClient";

export default async function ParcelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PlatformShell>
      <WorkspaceClient parcelId={id} />
    </PlatformShell>
  );
}
