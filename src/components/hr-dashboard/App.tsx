"use client";

import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "./ui/sidebar";
import {
  Search,
  Bell,
  User,
  X,
  CheckCircle,
  AlertCircle,
  InfoIcon,
  Settings,
  LogOut,
  UserCircle,
  Shield,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DashboardView } from "./DashboardView";
import { AIAssistant } from "./AIAssistant";
import { HR_MODULES, getModuleById, type HrModuleId } from "./hr-modules";
import { useNotifications, type Notification } from "./notifications";

export default function HRDashboardApp() {
  const [activeModule, setActiveModule] = useState<HrModuleId>("dashboard");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    notifications,
    notificationCounts,
    unreadCount,
    markAsRead,
    markAllAsRead,
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredModules = HR_MODULES.filter((module) =>
    module.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchOpen(query.length > 0);
  };

  const handleModuleSelect = (moduleId: HrModuleId) => {
    setActiveModule(moduleId);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <Sidebar variant="inset" className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                <span className="text-lg font-semibold text-white">B</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Bloomteq
                </h2>
                <p className="text-sm text-gray-500">HR Management System</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-6">
            <SidebarMenu className="space-y-1">
              {HR_MODULES.map((module) => {
                const Icon = module.icon;
                const hasNotifications =
                  (notificationCounts[module.id] || 0) > 0;
                const isActive = activeModule === module.id;

                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setActiveModule(module.id)}
                      className={`relative flex w-full cursor-pointer items-center gap-3 rounded-lg border-l-4 px-4 py-3 font-medium transition-all duration-200 group
                        ${
                          isActive
                            ? "border-l-gray-700 bg-white text-gray-900 shadow-sm"
                            : "border-l-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                      <div
                        className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200 ${
                          isActive ? "bg-white" : "bg-transparent"
                        }`}
                      />

                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200
                          ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <span
                        className={`flex-1 text-left text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-gray-700 group-hover:text-gray-900"
                        }`}
                      >
                        {module.label}
                      </span>

                      {hasNotifications && (
                        <div className="relative">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-200
                              ${
                                isActive
                                  ? "bg-white text-gray-900 shadow-sm"
                                  : "bg-gray-600 text-white group-hover:bg-gray-700"
                              }`}
                          >
                            {notificationCounts[module.id]}
                          </div>
                          <div
                            className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full animate-pulse ${
                              isActive ? "bg-gray-300" : "bg-red-500"
                            }`}
                          />
                        </div>
                      )}

                      {!isActive && (
                        <div className="absolute right-2 h-6 w-1 rounded-full bg-gray-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="font-medium">System Status: Online</span>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900" />
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
                  <span className="text-sm font-semibold text-white">B</span>
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">
                    {getModuleById(activeModule)?.label ?? "Dashboard"}
                  </h1>
                  <p className="text-sm text-gray-500">Bloomteq HR System</p>
                </div>
              </div>
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

              <Popover
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
              >
                <PopoverTrigger asChild>
                  <Button
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
                  <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-gray-100"
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                              !notification.isRead
                                ? "border-l-2 border-l-gray-400 bg-blue-25"
                                : ""
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <div className="h-2 w-2 shrink-0 rounded-full bg-gray-600" />
                                  )}
                                </div>
                                <p className="mb-2 text-sm text-gray-600">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="border-gray-200 text-xs text-gray-500"
                                  >
                                    {getModuleById(notification.module)?.label}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 p-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-center rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      >
                        View all notifications
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex h-9 items-center gap-3 rounded-lg pl-3 transition-colors hover:bg-gray-100"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-gray-200 text-sm font-medium text-gray-600">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-medium text-gray-900">
                        John Doe
                      </p>
                      <p className="text-xs text-gray-500">HR Manager</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="mr-4 w-64 rounded-lg border-gray-200 p-0 shadow-xl"
                  align="end"
                >
                  <div className="rounded-t-lg border-b border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="font-medium text-gray-700 bg-gray-200">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">John Doe</p>
                        <p className="text-sm text-gray-500">
                          john.doe@bloomteq.com
                        </p>
                        <p className="text-xs text-gray-400">HR Manager</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="mb-1 w-full justify-start gap-3 rounded-md"
                      onClick={() => setActiveModule("profiles")}
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
                      <DialogContent className="max-w-md rounded-lg">
                        <DialogHeader>
                          <DialogTitle>User Settings</DialogTitle>
                          <DialogDescription>
                            Manage your account preferences and notifications.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Email Notifications</Label>
                              <p className="text-xs text-gray-500">
                                Receive email updates
                              </p>
                            </div>
                            <Switch defaultChecked />
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

                        <div className="flex gap-2 pt-4">
                          <Button className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700">
                            Save Changes
                          </Button>
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
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          <main className="min-h-screen flex-1 bg-gray-50 p-6">
            <DashboardView activeModule={activeModule} />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
