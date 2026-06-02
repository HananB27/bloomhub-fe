"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { timeTrackingApi } from "@/lib/api/timeTracking";
import { notifyError, notifySuccess } from "@/utils/notificationHelpers";
import { Button } from "@/components/hr-dashboard/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/hr-dashboard/ui/card";

const RETURN_TO_KEY = "tempo_oauth_return_to";
const DEFAULT_RETURN_TO = "/?module=time-tracking&tempo_connected=1";

type ExchangeState =
  | { kind: "pending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function readReturnTo(): string {
  try {
    const stored = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    if (stored && stored.startsWith("/")) {
      const sep = stored.includes("?") ? "&" : "?";
      return `${stored}${sep}tempo_connected=1`;
    }
  } catch {
    // sessionStorage unavailable
  }
  return DEFAULT_RETURN_TO;
}

function TempoOAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<ExchangeState>({ kind: "pending" });
  const ranRef = useRef(false);

  const retry = useCallback(async () => {
    try {
      const { authorize_url } = await timeTrackingApi.startTempoOAuth({
        redirect_uri: `${window.location.origin}/oauth/tempo/callback`,
      });
      window.location.href = authorize_url;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to restart Tempo OAuth";
      notifyError(message);
      setState({ kind: "error", message });
    }
  }, []);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const providerError = params.get("error");
    if (providerError) {
      const description =
        params.get("error_description") ?? "Tempo authorization was denied.";
      setState({ kind: "error", message: description });
      return;
    }

    const code = params.get("code");
    const stateParam = params.get("state");
    if (!code || !stateParam) {
      setState({
        kind: "error",
        message: "Missing authorization code or state in callback URL.",
      });
      return;
    }

    (async () => {
      try {
        await timeTrackingApi.completeTempoOAuth(
          code,
          stateParam,
          `${window.location.origin}/oauth/tempo/callback`
        );
        notifySuccess("Tempo connected");
        setState({ kind: "success" });
        router.replace(readReturnTo());
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to complete Tempo OAuth";
        notifyError(message);
        setState({ kind: "error", message });
      }
    })();
  }, [params, router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4">
      <Card className="w-full overflow-hidden rounded-xl border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-white px-5 py-4">
          <CardTitle className="text-sm font-semibold text-gray-950">
            Connecting Tempo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-6">
          {state.kind === "pending" && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Finalizing your Tempo connection…
            </div>
          )}
          {state.kind === "success" && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Connected. Redirecting…
            </div>
          )}
          {state.kind === "error" && (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="flex-1">{state.message}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="h-8 rounded-lg bg-gray-950 text-white hover:bg-black"
                  onClick={() => void retry()}
                >
                  Try again
                </Button>
                <Button
                  variant="outline"
                  className="h-8 rounded-lg border-gray-200 bg-white text-gray-800"
                  onClick={() => router.replace("/")}
                >
                  Back to dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TempoOAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <TempoOAuthCallbackInner />
    </Suspense>
  );
}
