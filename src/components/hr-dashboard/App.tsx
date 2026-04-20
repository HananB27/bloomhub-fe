"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  InfoIcon,
  Settings,
  LogOut,
  UserCircle,
  Shield,
  HelpCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { DashboardView } from "./DashboardView";
import { AIAssistant } from "./AIAssistant";
import { HR_MODULES, getModuleById, type HrModuleId } from "./hr-modules";
import { useNotifications, type Notification } from "./notifications";
import {
  CollapsibleSidebar,
  SIDEBAR_COLLAPSED_OFFSET,
  SIDEBAR_EXPANDED_OFFSET,
} from "./CollapsibleSidebar";
import { formatRelativeTimestamp } from "@/utils";
import { getApiBaseUrl } from "@/lib/config";
import { logoutUser } from "@/lib/api/auth";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getStoredUser, storeTokens } from "@/lib/api/tokens";

export default function HRDashboardApp() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [careerLevel, setCareerLevel] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [storedUser] = useState<Record<string, unknown> | null>(() =>
    getStoredUser()
  );

  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);

    // Fetch career level from backend
    const fetchProfile = async () => {
      if (!session) return;

      const accessToken = (session as { accessToken?: string })?.accessToken;
      if (!accessToken) {
        return;
      }

      setIsProfileLoading(true);
      try {
        const baseUrl = getApiBaseUrl();

        const response = await fetch(`${baseUrl}/api/auth/profile/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCareerLevel(data.career_level);
        } else if (response.status === 401) {
          // Access token invalid/expired and refresh failed or not available.
          // Force user to sign out so they can re-authenticate.
          await signOut({ redirect: false });
          router.push("/login");
        }
      } catch (error) {
        // Log for diagnostics

        console.error("Profile fetch error:", error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (session) {
      // Avoid performing real network requests during unit tests
      if (process.env.NODE_ENV !== "test") {
        fetchProfile();
      }
    }

    return () => clearTimeout(timer);
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    const accessToken = (session as { accessToken?: string })?.accessToken;
    if (accessToken) {
      storeTokens({ access: accessToken });
    }
  }, [session]);

  const [activeModule, setActiveModule] = useState<HrModuleId>("dashboard");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    notificationCounts,
  } = useNotifications();

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <InfoIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredModules = useMemo(
    () =>
      HR_MODULES.filter((module) =>
        module.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchOpen(query.length > 0);
  };

  const handleLogout = async () => {
    await logoutUser("dummy-refresh");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleModuleSelect = (moduleId: HrModuleId | string) => {
    if (moduleId === "logout") {
      handleLogout();
      return;
    }
    setActiveModule(moduleId as HrModuleId);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const primaryItems = useMemo(
    () =>
      HR_MODULES.map((m) => ({
        id: m.id,
        label: m.label,
        icon: m.icon,
      })),
    []
  );

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <CollapsibleSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        primaryItems={primaryItems}
        activeId={activeModule}
        onSelect={handleModuleSelect as (moduleId: HrModuleId) => void}
        notificationCounts={notificationCounts}
      />

      <main
        className="flex h-screen flex-col transition-[margin] duration-300 ease-out"
        style={{
          marginLeft: sidebarCollapsed
            ? SIDEBAR_COLLAPSED_OFFSET
            : SIDEBAR_EXPANDED_OFFSET,
        }}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white pl-4 pr-0 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getModuleById(activeModule)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-9 w-64 rounded-lg border-gray-200 bg-gray-50 pl-9 pr-4 text-sm focus:border-gray-300 focus:bg-white"
                />
              </div>

              {isSearchOpen && filteredModules.length > 0 && (
                <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredModules.slice(0, 6).map((module) => {
                    const Icon = module.icon;
                    return (
                      <button
                        key={module.id}
                        onClick={() => handleModuleSelect(module.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50"
                        type="button"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Icon className="h-4 w-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {module.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <AIAssistant
              activeModule={activeModule}
              onModuleNavigate={(moduleId) => setActiveModule(moduleId)}
            />

            {mounted ? (
              <Popover
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    data-testid="notifications-trigger"
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-lg transition-colors hover:bg-gray-100"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gray-600 p-0 text-xs text-white hover:bg-gray-700">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="mr-4 w-80 rounded-lg border-gray-200 p-0 shadow-xl"
                  align="end"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 ${
                              !notification.isRead ? "bg-blue-50/50" : ""
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="mt-1 shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-[10px] text-gray-400">
                                {formatRelativeTimestamp(
                                  notification.timestamp
                                )}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-lg"
              >
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
            )}

            {status === "loading" || isProfileLoading ? (
              <div className="flex h-9 items-center gap-2 rounded-lg bg-gray-50/50 px-3 py-1 border border-gray-100">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">
                  Loading...
                </span>
              </div>
            ) : mounted ? (
              <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="profile-trigger"
                    variant="ghost"
                    className="flex h-9 items-center gap-3 rounded-lg pl-3 pr-4 transition-colors hover:bg-gray-200 bg-gray-50/50 border border-transparent hover:border-gray-200"
                  >
                    <Avatar className="h-7 w-7 border border-gray-200">
                      {(session?.user?.image ||
                        (storedUser?.avatar_url as string)) && (
                        <AvatarImage
                          src={
                            (session?.user?.image as string) ||
                            (storedUser?.avatar_url as string)
                          }
                          alt="User avatar"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <AvatarFallback className="bg-gray-200 text-sm font-medium text-gray-600">
                        {(() => {
                          const firstName = String(
                            storedUser?.first_name || ""
                          ).trim();
                          const lastName = String(
                            storedUser?.last_name || ""
                          ).trim();
                          const userName =
                            session?.user?.name ||
                            (firstName && lastName
                              ? `${firstName} ${lastName}`
                              : (storedUser?.email as string) ||
                                (storedUser?.username as string));
                          if (userName) {
                            return userName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2);
                          }
                          return "U";
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-end leading-tight text-right text-gray-900 dark:text-white">
                      <span className="text-sm font-semibold truncate max-w-[150px]">
                        {(() => {
                          const firstName = String(
                            storedUser?.first_name || ""
                          ).trim();
                          const lastName = String(
                            storedUser?.last_name || ""
                          ).trim();
                          return (
                            session?.user?.name ||
                            (firstName && lastName
                              ? `${firstName} ${lastName}`
                              : (storedUser?.email as string) ||
                                (storedUser?.username as string) ||
                                "User")
                          );
                        })()}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {careerLevel || "Member"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="mr-4 w-80 rounded-lg border-gray-200 p-0 shadow-xl"
                  align="end"
                >
                  <div className="rounded-t-lg border-b border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-gray-200">
                        {(session?.user?.image ||
                          (storedUser?.avatar_url as string)) && (
                          <AvatarImage
                            src={
                              (session?.user?.image as string) ||
                              (storedUser?.avatar_url as string)
                            }
                            alt="User avatar"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <AvatarFallback className="font-medium text-gray-700 bg-gray-200">
                          {(() => {
                            const firstName = String(
                              storedUser?.first_name || ""
                            ).trim();
                            const lastName = String(
                              storedUser?.last_name || ""
                            ).trim();
                            const userName =
                              session?.user?.name ||
                              (firstName && lastName
                                ? `${firstName} ${lastName}`
                                : (storedUser?.email as string) ||
                                  (storedUser?.username as string));
                            if (userName) {
                              return userName
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);
                            }
                            return "U";
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {(() => {
                            const firstName = String(
                              storedUser?.first_name || ""
                            ).trim();
                            const lastName = String(
                              storedUser?.last_name || ""
                            ).trim();
                            return (
                              session?.user?.name ||
                              (firstName && lastName
                                ? `${firstName} ${lastName}`
                                : (storedUser?.email as string) ||
                                  (storedUser?.username as string) ||
                                  "User")
                            );
                          })()}
                        </p>
                        <p className="text-sm text-gray-600 break-all">
                          {session?.user?.email ||
                            (storedUser?.email as string) ||
                            "user@example.com"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {careerLevel || "Member"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="mb-1 w-full justify-start gap-3 rounded-md"
                      onClick={() => handleModuleSelect("profiles")}
                    >
                      <UserCircle className="h-4 w-4" />
                      View Profile
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="mb-1 w-full justify-start gap-3 rounded-md"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>User Settings</DialogTitle>
                          <DialogDescription>
                            Manage your account preferences and notifications.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Email Notifications</Label>
                              <p className="text-xs text-gray-500">
                                Receive daily updates via email
                              </p>
                            </div>
                            <Switch />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Push Notifications</Label>
                              <p className="text-xs text-gray-500">
                                Browser notifications
                              </p>
                            </div>
                            <Switch />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Dark Mode</Label>
                              <p className="text-xs text-gray-500">
                                Toggle dark theme
                              </p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      className="mb-1 w-full justify-start gap-3 rounded-md"
                    >
                      <Shield className="h-4 w-4" />
                      Privacy
                    </Button>
                    <Button
                      variant="ghost"
                      className="mb-1 w-full justify-start gap-3 rounded-md"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help & Support
                    </Button>

                    <Separator className="my-2" />

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-auto bg-gray-50 p-4 dark:bg-gray-950">
          <div className="w-full min-w-0">
            <DashboardView
              activeModule={activeModule}
              addNotification={addNotification}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
