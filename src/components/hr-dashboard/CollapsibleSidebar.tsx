"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { type LucideIcon } from "lucide-react";
import { ChevronLeft, UserCircle, LogOut } from "lucide-react";
import type { HrModuleId } from "./hr-modules";

const SIDEBAR_WIDTH = 270;
const SIDEBAR_WIDTH_COLLAPSED = 85;
const TOOLTIP_GAP = 12;

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface CollapsibleSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  primaryItems: NavItem[];
  activeId: string;
  onSelect: (id: HrModuleId) => void;
  notificationCounts?: Record<string, number>;
}

export function CollapsibleSidebar({
  collapsed,
  onToggle,
  primaryItems,
  activeId,
  onSelect,
  notificationCounts = {},
}: CollapsibleSidebarProps) {
  const [tooltip, setTooltip] = useState<{
    label: string;
    anchorRect: DOMRect;
  } | null>(null);

  const showTooltip = useCallback(
    (label: string, e: React.MouseEvent<HTMLElement>) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltip({ label, anchorRect: rect });
    },
    []
  );

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const secondaryItems: NavItem[] = [
    { id: "profile", label: "Profile", icon: UserCircle },
    { id: "logout", label: "Logout", icon: LogOut },
  ];

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-20 flex h-screen flex-col overflow-hidden rounded-r-2xl border-y border-r border-gray-200 bg-white shadow-sm transition-[width] duration-300 ease-out dark:border-gray-800 dark:bg-[#151A2D] dark:shadow-none"
        style={{
          width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        }}
      >
        <header
          className={`flex shrink-0 items-center transition-all duration-300 ${
            collapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-4"
          }`}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white dark:text-[#151A2D] dark:hover:bg-[#dde4fb]"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="h-5 w-5 transition-transform duration-300 rotate-180" />
            </button>
          ) : (
            <>
              <a
                href="#"
                className="flex items-center gap-3"
                aria-label="Bloomteq"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-[#151A2D]"
                  aria-hidden
                >
                  <span className="text-lg font-bold">B</span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                    Bloomteq
                  </h2>
                  <p className="truncate text-xs text-gray-500 dark:text-white/70">
                    HR Management System
                  </p>
                </div>
              </a>
              <button
                type="button"
                onClick={onToggle}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white dark:text-[#151A2D] dark:hover:bg-[#dde4fb]"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-5 w-5 transition-transform duration-300" />
              </button>
            </>
          )}
        </header>

        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <ul
            className="flex flex-1 min-h-0 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-4 py-2 transition-transform duration-300"
            style={{
              transform: collapsed ? "translateY(8px)" : "translateY(0)",
            }}
          >
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              const count = notificationCounts[item.id] ?? 0;

              return (
                <li key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id as HrModuleId)}
                    onMouseEnter={
                      collapsed ? (e) => showTooltip(item.label, e) : undefined
                    }
                    onMouseLeave={collapsed ? hideTooltip : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-300 ${
                      collapsed ? "justify-center rounded-xl px-0 py-2.5" : ""
                    } ${
                      isActive
                        ? "bg-gray-900 text-white dark:bg-white dark:text-[#151A2D]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-white dark:hover:text-[#151A2D]"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </span>
                    {!collapsed && (
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && count > 0 && (
                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                          isActive
                            ? "bg-white/20 text-white dark:bg-[#151A2D]/15 dark:text-[#151A2D]"
                            : "bg-gray-200 text-gray-700 dark:bg-white/20 dark:text-white"
                        }`}
                      >
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <ul className="mt-auto flex shrink-0 flex-col gap-0.5 border-t border-gray-200 px-4 py-3 dark:border-white/10">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="relative">
                  <button
                    type="button"
                    onMouseEnter={
                      collapsed ? (e) => showTooltip(item.label, e) : undefined
                    }
                    onMouseLeave={collapsed ? hideTooltip : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-white dark:hover:text-[#151A2D] ${
                      collapsed ? "justify-center rounded-xl px-0" : ""
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </span>
                    {!collapsed && (
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Tooltip portal: renders above main content so it's never behind it */}
      {typeof document !== "undefined" &&
        tooltip &&
        createPortal(
          <div
            className="fixed z-9999 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-lg dark:border-0 dark:bg-white dark:text-[#151A2D] dark:shadow-xl"
            style={{
              left: tooltip.anchorRect.right + TOOLTIP_GAP,
              top: tooltip.anchorRect.top + tooltip.anchorRect.height / 2,
              transform: "translateY(-50%)",
            }}
          >
            {tooltip.label}
          </div>,
          document.body
        )}
    </>
  );
}

export const SIDEBAR_EXPANDED_OFFSET = SIDEBAR_WIDTH;
export const SIDEBAR_COLLAPSED_OFFSET = SIDEBAR_WIDTH_COLLAPSED;
