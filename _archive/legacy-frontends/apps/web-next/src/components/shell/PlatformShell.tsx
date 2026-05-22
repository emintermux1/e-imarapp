import { PropsWithChildren } from "react";
import { TopBar } from "./TopBar";

export function PlatformShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <TopBar />
      <div className="mx-auto max-w-[1700px] p-4">{children}</div>
    </div>
  );
}
