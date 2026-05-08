import { PlatformShell } from "@/components/shell/PlatformShell";
import { WorkspaceClient } from "@/components/workspace/WorkspaceClient";

export default function WorkspacePage() {
  return (
    <PlatformShell>
      <WorkspaceClient />
    </PlatformShell>
  );
}
