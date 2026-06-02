import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { timeTrackingApi, type TempoOAuthStatus } from "@/lib/api/timeTracking";
import { notifyError, notifySuccess } from "@/utils/notificationHelpers";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const RETURN_TO_KEY = "tempo_oauth_return_to";

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExpired(status: TempoOAuthStatus | null): boolean {
  if (!status?.token_expires_at) return false;
  const expiry = new Date(status.token_expires_at).getTime();
  return Number.isFinite(expiry) && expiry < Date.now();
}

export interface TempoConnectionCardProps {
  canConnect?: boolean;
  connectDisabledReason?: string;
  onStatusChange?: (status: TempoOAuthStatus | null) => void;
}

export function TempoConnectionCard({
  canConnect = true,
  connectDisabledReason,
  onStatusChange,
}: TempoConnectionCardProps) {
  const [status, setStatus] = useState<TempoOAuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await timeTrackingApi.getTempoOAuthStatus();
      setStatus(next);
      onStatusChange?.(next);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load Tempo status";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnect = useCallback(async () => {
    if (!canConnect) {
      notifyError(connectDisabledReason || "Connect Jira before Tempo.");
      return;
    }

    setIsWorking(true);
    try {
      const jiraStatus = await timeTrackingApi
        .getJiraOAuthStatus()
        .catch(() => null);
      const { authorize_url } = await timeTrackingApi.startTempoOAuth({
        jira_url:
          jiraStatus?.connected && jiraStatus.site_url
            ? jiraStatus.site_url
            : undefined,
        redirect_uri: `${window.location.origin}/oauth/tempo/callback`,
      });
      sessionStorage.setItem(
        RETURN_TO_KEY,
        window.location.pathname + window.location.search
      );
      window.location.href = authorize_url;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to start Tempo OAuth";
      notifyError(message);
      setIsWorking(false);
    }
  }, [canConnect, connectDisabledReason]);

  const handleDisconnect = useCallback(async () => {
    if (
      !window.confirm(
        "Disconnect your Tempo account? Future imports will stop until you reconnect."
      )
    ) {
      return;
    }
    setIsWorking(true);
    try {
      await timeTrackingApi.disconnectTempo();
      notifySuccess("Tempo disconnected");
      await loadStatus();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to disconnect Tempo";
      notifyError(message);
    } finally {
      setIsWorking(false);
    }
  }, [loadStatus]);

  const connected = status?.connected === true;
  const expired = connected && isExpired(status);

  return (
    <Card className="overflow-hidden rounded-xl border-gray-200 bg-white shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-950">
              My Tempo connection
            </CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              Connect your own Tempo account so imports and worklog reads use
              your token instead of a shared admin token.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 rounded-lg border-gray-200 bg-white text-gray-800"
              onClick={() => void loadStatus()}
              disabled={isLoading || isWorking}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1">{error}</div>
            <Button
              variant="outline"
              className="h-7 rounded-lg border-red-200 bg-white text-red-700"
              onClick={() => void loadStatus()}
            >
              Retry
            </Button>
          </div>
        ) : connected ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {expired ? (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Reconnect required
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              )}
              {status?.site_url && (
                <a
                  href={status.site_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                >
                  {status.site_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {status?.tempo_display_name && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Name
                  </dt>
                  <dd className="text-gray-900">{status.tempo_display_name}</dd>
                </div>
              )}
              {status?.tempo_email && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Email
                  </dt>
                  <dd className="text-gray-900">{status.tempo_email}</dd>
                </div>
              )}
              {status?.connected_at && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Connected on
                  </dt>
                  <dd className="text-gray-900">
                    {formatDate(status.connected_at)}
                  </dd>
                </div>
              )}
              {status?.token_expires_at && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">
                    Token expires
                  </dt>
                  <dd className="text-gray-900">
                    {formatDate(status.token_expires_at)}
                  </dd>
                </div>
              )}
            </dl>
            {expired && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  Your Tempo token has expired and could not be refreshed.
                  Reconnect to resume imports.
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {expired && (
                <Button
                  variant="primary"
                  className="h-8 rounded-lg bg-gray-950 text-white hover:bg-black"
                  onClick={() => void handleConnect()}
                  disabled={isWorking || !canConnect}
                >
                  Reconnect
                </Button>
              )}
              <Button
                variant="outline"
                className="h-8 rounded-lg border-gray-200 bg-white text-gray-800"
                onClick={() => void handleDisconnect()}
                disabled={isWorking}
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              {canConnect
                ? "No Tempo account linked. Connect to enable per-user imports."
                : connectDisabledReason || "Connect Jira before Tempo."}
            </p>
            <Button
              variant="primary"
              className="h-8 rounded-lg bg-gray-950 text-white hover:bg-black"
              onClick={() => void handleConnect()}
              disabled={isWorking || !canConnect}
            >
              Connect Tempo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TempoConnectionCard;
