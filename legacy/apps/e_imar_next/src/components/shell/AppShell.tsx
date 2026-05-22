'use client';

import { type ReactNode } from 'react';
import { TopAppBar } from './TopAppBar';
import { LeftSidebar, LeftSidebarDrawer } from './LeftSidebar';
import { RightContextPanel, RightContextPanelDrawer } from './RightContextPanel';
import { BottomSheet } from './BottomSheet';
import { useUIStore } from '@/lib/store/ui-store';
import { cn } from '@/lib/utils/cn';

interface AppShellProps {
  children: ReactNode;
  className?: string;
  /** Show right panel at lg+ (defaults to true). Stub pages disable to make their copy the focus. */
  showRightPanel?: boolean;
  /** Show left sidebar at lg+ (defaults to true). */
  showLeftSidebar?: boolean;
  /** Mount the mobile bottom sheet (defaults to true). Stub pages can disable. */
  showBottomSheet?: boolean;
}

export function AppShell({
  children,
  className,
  showRightPanel = true,
  showLeftSidebar = true,
  showBottomSheet = true,
}: AppShellProps) {
  const leftSidebarOpen = useUIStore((s) => s.leftSidebarOpen);
  const setLeftSidebarOpen = useUIStore((s) => s.setLeftSidebarOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  const gridCols = (() => {
    if (showLeftSidebar && showRightPanel) {
      return 'lg:grid-cols-[320px_minmax(0,1fr)_420px]';
    }
    if (showLeftSidebar) return 'lg:grid-cols-[320px_minmax(0,1fr)]';
    if (showRightPanel) return 'lg:grid-cols-[minmax(0,1fr)_420px]';
    return 'lg:grid-cols-[minmax(0,1fr)]';
  })();

  return (
    <div className={cn('flex min-h-[100dvh] flex-col bg-bg-base text-text-primary', className)}>
      <TopAppBar />
      <div className={cn('relative grid flex-1 grid-cols-1', gridCols, 'overflow-hidden')}>
        {showLeftSidebar ? (
          <div className="hidden h-[calc(100dvh-64px)] lg:block">
            <LeftSidebar className="h-full" />
          </div>
        ) : null}
        <main className="relative h-[calc(100dvh-64px)] overflow-hidden">{children}</main>
        {showRightPanel ? (
          <div className="hidden h-[calc(100dvh-64px)] lg:block">
            <RightContextPanel className="h-full" />
          </div>
        ) : null}
      </div>

      {/* Mobile drawers */}
      {showLeftSidebar ? (
        <LeftSidebarDrawer open={leftSidebarOpen} onClose={() => setLeftSidebarOpen(false)} />
      ) : null}
      {showRightPanel ? (
        <RightContextPanelDrawer
          open={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      ) : null}

      {/* Mobile bottom sheet — only when both side panels are real */}
      {showBottomSheet && (showLeftSidebar || showRightPanel) ? <BottomSheet /> : null}
    </div>
  );
}
