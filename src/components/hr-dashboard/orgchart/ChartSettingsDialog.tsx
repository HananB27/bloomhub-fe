"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import type { ChartSettings } from "./useChartSettings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChartSettings;
  onChange: <K extends keyof ChartSettings>(
    key: K,
    value: ChartSettings[K]
  ) => void;
  onReset: () => void;
  onResetPositions: () => void;
}

export function ChartSettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
  onReset,
  onResetPositions,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Chart settings
          </DialogTitle>
          <DialogDescription>
            Preferences are saved to your browser. Reset to revert to defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Row
            label="Smooth animations"
            hint="Disable to maximize FPS when dragging or filtering."
          >
            <Switch
              checked={settings.animations}
              onCheckedChange={(v) => onChange("animations", v)}
            />
          </Row>

          <Row
            label="Background grid"
            hint="Show the radial dot pattern behind the chart."
          >
            <Switch
              checked={settings.showGrid}
              onCheckedChange={(v) => onChange("showGrid", v)}
            />
          </Row>

          <Row
            label="Compact node cards"
            hint="Force every employee card to the smaller layout."
          >
            <Switch
              checked={settings.compactNodes}
              onCheckedChange={(v) => onChange("compactNodes", v)}
            />
          </Row>

          <Row
            label="Show department pills"
            hint="Department badge under the role on each node."
          >
            <Switch
              checked={settings.showDeptPill}
              onCheckedChange={(v) => onChange("showDeptPill", v)}
            />
          </Row>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Edge opacity
              </Label>
              <span className="font-mono text-xs tabular-nums text-gray-500">
                {Math.round(settings.edgeOpacity * 100)}%
              </span>
            </div>
            <Slider
              min={10}
              max={100}
              step={1}
              value={[Math.round(settings.edgeOpacity * 100)]}
              onValueChange={(v) => onChange("edgeOpacity", v[0] / 100)}
              className="py-1"
            />
            <p className="text-xs text-gray-500">
              Lower values fade the reporting lines so node cards stand out.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetPositions}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset node positions
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset to defaults
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
      </div>
      {children}
    </div>
  );
}
