"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Loader2, Plus, Trash2, Webhook } from "lucide-react";
import {
  announcementDiscordChannelApi,
  type AnnouncementDiscordChannel,
  type AnnouncementDiscordChannelPayload,
  type AnnouncementType,
} from "@/lib/api/announcements";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner";

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "general",
  "news",
  "celebration",
  "urgent",
];

type EnabledFilter = "all" | "true" | "false";

interface FormState {
  announcement_type: AnnouncementType;
  channel_name: string;
  webhook_url: string;
  enabled: boolean;
}

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

const EMPTY_FORM: FormState = {
  announcement_type: "general",
  channel_name: "",
  webhook_url: "",
  enabled: true,
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatType(value: AnnouncementType) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isValidDiscordWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "discord.com" || url.hostname === "discordapp.com") &&
      url.pathname.startsWith("/api/webhooks/")
    );
  } catch {
    return false;
  }
}

function extractFieldErrors(message: string): FormErrors {
  const errors: FormErrors = { general: message };
  for (const field of [
    "announcement_type",
    "channel_name",
    "webhook_url",
    "enabled",
  ] as const) {
    const match = message.match(new RegExp(`${field}:\\s*([^;]+)`, "i"));
    if (match?.[1]) {
      errors[field] = match[1].trim();
      delete errors.general;
    }
  }
  return errors;
}

export function DiscordAnnouncementChannelsTab() {
  const [channels, setChannels] = useState<AnnouncementDiscordChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementDiscordChannel | null>(
    null
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<AnnouncementDiscordChannel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const listParams = useMemo(
    () => ({
      announcement_type: typeFilter === "all" ? undefined : typeFilter,
      enabled: enabledFilter === "all" ? undefined : enabledFilter === "true",
    }),
    [enabledFilter, typeFilter]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadChannels() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await announcementDiscordChannelApi.list(listParams, {
          signal: controller.signal,
        });
        setChannels(data.results);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load Discord announcement channels";
        setLoadError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadChannels();

    return () => controller.abort();
  }, [listParams]);

  const openCreateDialog = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (channel: AnnouncementDiscordChannel) => {
    setEditing(channel);
    setForm({
      announcement_type: channel.announcement_type,
      channel_name: channel.channel_name,
      webhook_url: "",
      enabled: channel.enabled,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const channelName = form.channel_name.trim();
    const webhookUrl = form.webhook_url.trim();

    if (!channelName) {
      nextErrors.channel_name = "Channel name is required.";
    }

    if (!editing && !webhookUrl) {
      nextErrors.webhook_url = "Webhook URL is required.";
    }

    if (webhookUrl && !isValidDiscordWebhookUrl(webhookUrl)) {
      nextErrors.webhook_url = "Enter a valid Discord webhook URL.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const webhookUrl = form.webhook_url.trim();
    const payload: AnnouncementDiscordChannelPayload = {
      announcement_type: form.announcement_type,
      channel_name: form.channel_name.trim(),
      enabled: form.enabled,
      ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
    };

    try {
      setIsSaving(true);
      setErrors({});
      const saved = editing
        ? await announcementDiscordChannelApi.update(editing.id, payload)
        : await announcementDiscordChannelApi.create(payload);

      setChannels((prev) => {
        if (!editing) return [saved, ...prev];
        return prev.map((channel) =>
          channel.id === saved.id ? saved : channel
        );
      });
      setDialogOpen(false);
      toast.success(
        editing
          ? "Discord announcement channel updated."
          : "Discord announcement channel created."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save Discord announcement channel";
      setErrors(extractFieldErrors(message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await announcementDiscordChannelApi.delete(deleteTarget.id);
      setChannels((prev) =>
        prev.filter((channel) => channel.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      toast.success("Discord announcement channel deleted.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete Discord announcement channel"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Discord Announcement Channels
              </CardTitle>
              <CardDescription>
                Map announcement types to Discord webhook channels.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={typeFilter}
                onValueChange={(value: AnnouncementType | "all") =>
                  setTypeFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {ANNOUNCEMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={enabledFilter}
                onValueChange={(value: EnabledFilter) =>
                  setEnabledFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Channel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : channels.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
              No Discord announcement channels found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">
                        {channel.channel_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatType(channel.announcement_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={channel.enabled ? "success" : "secondary"}
                        >
                          {channel.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            channel.has_webhook_url ? "primary" : "outline"
                          }
                        >
                          {channel.has_webhook_url ? "Configured" : "Missing"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(channel.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(channel.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(channel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setDeleteTarget(channel)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Discord channel" : "New Discord channel"}
            </DialogTitle>
            <DialogDescription>
              {editing?.has_webhook_url
                ? "Webhook configured. Leave blank to preserve existing secret."
                : "Webhook URL is write-only and will not be shown again."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {errors.general && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="discord-announcement-type">
                Announcement type
              </Label>
              <Select
                value={form.announcement_type}
                onValueChange={(value: AnnouncementType) =>
                  setForm((prev) => ({ ...prev, announcement_type: value }))
                }
              >
                <SelectTrigger id="discord-announcement-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.announcement_type && (
                <p className="text-sm text-red-600">
                  {errors.announcement_type}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord-channel-name">Channel name</Label>
              <Input
                id="discord-channel-name"
                value={form.channel_name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    channel_name: event.target.value,
                  }))
                }
                placeholder="company-news"
              />
              {errors.channel_name && (
                <p className="text-sm text-red-600">{errors.channel_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord-webhook-url">Webhook URL</Label>
              <Input
                id="discord-webhook-url"
                type="password"
                value={form.webhook_url}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    webhook_url: event.target.value,
                  }))
                }
                placeholder={
                  editing?.has_webhook_url
                    ? "Webhook configured"
                    : "https://discord.com/api/webhooks/..."
                }
              />
              {errors.webhook_url && (
                <p className="text-sm text-red-600">{errors.webhook_url}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="discord-channel-enabled">Enabled</Label>
                <p className="text-sm text-gray-500">
                  Allow published matching announcements to post to Discord.
                </p>
              </div>
              <Switch
                id="discord-channel-enabled"
                checked={form.enabled}
                onCheckedChange={(enabled) =>
                  setForm((prev) => ({ ...prev, enabled }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Channel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discord channel?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.channel_name} for{" "}
              {deleteTarget ? formatType(deleteTarget.announcement_type) : ""}{" "}
              announcements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
