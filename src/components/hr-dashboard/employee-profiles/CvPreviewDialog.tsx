import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";

interface CvPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string | null;
  isLoading: boolean;
}

export function CvPreviewDialog({
  open,
  onOpenChange,
  title,
  url,
  isLoading,
}: CvPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[88vh] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col rounded-2xl">
        <DialogTitle className="px-6 pt-5 pb-3 text-base font-semibold text-zinc-900 border-b border-zinc-200 bg-white flex items-center justify-between">
          <span className="truncate">{title}</span>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full ml-4 shrink-0">
            CV Preview
          </span>
        </DialogTitle>
        <DialogDescription className="sr-only">
          Inline preview for selected CV version.
        </DialogDescription>
        <div className="flex-1 bg-linear-to-b from-zinc-100 to-zinc-200 p-4">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center gap-2 text-zinc-600 bg-white/70 rounded-xl border border-zinc-200">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading document preview...
            </div>
          ) : url ? (
            <div className="h-full w-full rounded-xl overflow-hidden border border-zinc-300 shadow-sm bg-white">
              <iframe
                src={getEmbeddedPreviewUrl(url, title)}
                title={title}
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500 bg-white/70 rounded-xl border border-zinc-200">
              Unable to load preview.
            </div>
          )}
        </div>
        {url ? (
          <div className="px-6 py-3 border-t border-zinc-200 bg-white flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Tip: Some browsers may ignore PDF pane preferences.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
