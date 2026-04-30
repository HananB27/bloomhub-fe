"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { type LucideIcon } from "lucide-react";
import { ChevronLeft, UserCircle, LogOut } from "lucide-react";
import { Button } from "./ui/button";
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

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
        className="fixed left-0 top-0 z-20 flex h-screen flex-col overflow-hidden border-y border-r border-[#262626] bg-[#171717] transition-[width] duration-300 ease-out"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#262626] text-[#e5e7eb] transition-colors hover:bg-[#333]"
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
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent"
                  aria-hidden
                >
                  <img
                    src="/bloomteq.jpg"
                    alt="Bloomteq Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-white">
                    Bloomteq
                  </h2>
                  <p className="truncate text-xs text-[#9ca3af]">
                    HR Management System
                  </p>
                </div>
              </a>
              <button
                type="button"
                onClick={onToggle}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#262626] text-[#e5e7eb] transition-colors hover:bg-[#333]"
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
                        ? "bg-[#262626] text-white"
                        : "text-[#9ca3af] hover:bg-[#1f1f1f] hover:text-[#f3f4f6]"
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
                            ? "bg-white/20 text-white"
                            : "bg-[#404040] text-gray-300"
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

          <ul className="mt-auto flex shrink-0 flex-col gap-0.5 border-t border-[#262626] px-4 py-3">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="relative mt-1">
                  {item.id === "logout" ? (
                    <Button
                      variant="ghost"
                      onClick={() => onSelect(item.id as HrModuleId)}
                      onMouseEnter={
                        collapsed
                          ? (e) => showTooltip(item.label, e)
                          : undefined
                      }
                      onMouseLeave={collapsed ? hideTooltip : undefined}
                      className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left font-medium text-[#9ca3af] transition-colors duration-300 hover:bg-[#1f1f1f] hover:text-[#f3f4f6] ${
                        collapsed ? "justify-center px-0" : "justify-start"
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(item.id as HrModuleId)}
                      onMouseEnter={
                        collapsed
                          ? (e) => showTooltip(item.label, e)
                          : undefined
                      }
                      onMouseLeave={collapsed ? hideTooltip : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#9ca3af] transition-colors duration-300 hover:bg-[#1f1f1f] hover:text-[#f3f4f6] ${
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
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {mounted &&
        tooltip &&
        createPortal(
          <div
            className="fixed z-9999 whitespace-nowrap rounded-lg border border-[#404040] bg-[#1f1f1f] px-3 py-2 text-sm font-medium text-white shadow-lg"
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
