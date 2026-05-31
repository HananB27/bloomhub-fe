"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  Bell,
  Bot,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Clock,
  Command,
  FileText,
  Laptop,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { HR_MODULES, type HrModuleId } from "./hr-modules";
import {
  AiChatApiError,
  deleteAiChatSession,
  getAiChatSession,
  listAiChatSessions,
  sendAiChatMessage,
  type AiChatHistoryMessage,
  type AiChatResponse,
  type AiChatSessionSummary,
  type AiEntity,
  type AiEntitySpan,
  type AiEntityType,
  type AiPendingConfirmation,
  type AiUiAction,
  type AiUiActionType,
  type JsonValue,
} from "@/lib/api/aiChat";
import {
  dedupeEntities,
  entityModule,
  spliceEntityTokens,
  type LinearToken,
} from "@/lib/ai/entities";
import { PendingConfirmationCard } from "./ai/PendingConfirmationCard";
import {
  approveLeaveRequest,
  hrApproveLeaveRequest,
} from "@/lib/api/vacations";
import { usePendingExpiry } from "@/hooks/usePendingExpiry";
import { humanizeKey } from "@/lib/ai/schema";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  module?: string | null;
  toolName?: string | null;
  result?: JsonValue;
  entities?: AiEntity[];
  entitySpans?: AiEntitySpan[];
  requiresConfirmation?: boolean;
  requiresInput?: boolean;
  pendingConfirmation?: AiPendingConfirmation | null;
  uiActionType?: AiUiActionType | null;
  uiAction?: AiUiAction | null;
  superseded?: boolean;
  fieldErrors?: Record<string, string>;
  confirmError?: string | null;
  sourceUserMessage?: string;
}

interface AIAssistantProps {
  activeModule: HrModuleId;
  onModuleNavigate: (moduleId: HrModuleId, entityId?: number) => void;
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ask about leave balances, pending requests, employee data, documents, or other BloomHub tasks.",
  timestamp: new Date(),
};

function getSessionId(session: AiChatSessionSummary): number {
  return session.session_id ?? session.id;
}

function getSessionTitle(session: AiChatSessionSummary): string {
  return (
    session.title?.trim() ||
    session.last_message?.trim() ||
    `Chat #${getSessionId(session)}`
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatError(error: unknown): string {
  if (error instanceof AiChatApiError) {
    return `${error.status}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return "AI assistant request failed.";
}

function approvalRequestIdFromText(content: string): string | null {
  if (
    !/approve this leave request|approve (?:leave request|it)|HR final approval/i.test(
      content
    )
  ) {
    return null;
  }

  const match =
    /Leave Request\s*#\s*(\d+)/i.exec(content) ??
    /leave request ID\s*(\d+)/i.exec(content);

  return match?.[1] ?? null;
}

function isHrFinalApprovalText(content: string): boolean {
  return /HR final approval/i.test(content);
}

function isApprovalConfirmation(text: string): boolean {
  return /^(yes|y|approve|confirm|go ahead|do it|you can approve|please approve|approve it)$/i.test(
    text.trim()
  );
}

function uiActionToPending(action: AiUiAction): AiPendingConfirmation {
  return {
    tool_name: action.tool_name,
    module: action.module,
    confirmation_label: action.label,
    confirmation_help: action.help,
    arguments: action.arguments,
    proposed_arguments: action.arguments,
    args_schema: action.args_schema,
    expires_at: action.expires_at,
  };
}

function formatActionValue(value: JsonValue | undefined): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isHrModuleId(value: string | null | undefined): value is HrModuleId {
  return HR_MODULES.some((module) => module.id === value);
}

const THINKING_STAGES: { after: number; label: string }[] = [
  { after: 0, label: "Thinking" },
  { after: 2, label: "Reading your request" },
  { after: 5, label: "Checking your data" },
  { after: 9, label: "Consulting modules" },
  { after: 14, label: "Running tools" },
  { after: 22, label: "Almost there" },
];

function ThinkingIndicator() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  const stage =
    [...THINKING_STAGES].reverse().find((s) => elapsed >= s.after) ??
    THINKING_STAGES[0];

  return (
    <div className="flex justify-start">
      <div className="min-w-[180px] rounded-xl rounded-bl-sm border border-gray-200 bg-gray-100 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Sparkles className="h-4 w-4 animate-pulse text-gray-500" />
          <span className="font-medium">{stage.label}</span>
          <span className="inline-flex gap-0.5">
            <span
              className="h-1 w-1 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-1 w-1 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1 w-1 animate-bounce rounded-full bg-gray-400"
              style={{ animationDelay: "300ms" }}
            />
          </span>
          {elapsed >= 5 && (
            <span className="ml-auto text-[0.7rem] text-gray-400">
              {elapsed}s
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          <div
            className="h-2 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.6) 50%, rgba(0,0,0,0) 100%)",
              backgroundSize: "200% 100%",
              animation: "bh-shimmer 1.4s linear infinite",
            }}
          />
          <div
            className="h-2 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.6) 50%, rgba(0,0,0,0) 100%)",
              backgroundSize: "200% 100%",
              animation: "bh-shimmer 1.6s linear infinite",
            }}
          />
        </div>
      </div>
      <style jsx global>{`
        @keyframes bh-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

function responseToMessage(response: AiChatResponse): ChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: response.message || "Done.",
    timestamp: new Date(),
    module: response.module,
    toolName: response.tool_name,
    result: response.result,
    entities: response.entities,
    entitySpans: response.entity_spans,
    requiresConfirmation: Boolean(
      response.requires_confirmation || response.requires_input
    ),
    requiresInput: Boolean(response.requires_input),
    pendingConfirmation: response.pending_confirmation ?? null,
    uiActionType: response.ui_action_type ?? response.ui_action?.type ?? null,
    uiAction: response.ui_action ?? null,
  };
}

function historyToMessage(
  message: AiChatHistoryMessage,
  index: number
): ChatMessage {
  const roleValue = message.role ?? message.type ?? message.sender;
  const role: ChatRole = roleValue === "user" ? "user" : "assistant";
  const createdAt = message.created_at ?? message.timestamp;

  const metadata = message.metadata ?? {};
  const entities =
    message.entities ?? (metadata.entities as AiEntity[] | undefined);
  const entitySpans =
    message.entity_spans ??
    (metadata.entity_spans as AiEntitySpan[] | undefined);

  return {
    id: String(message.id ?? `history-${index}`),
    role,
    content: message.content ?? message.message ?? "",
    timestamp: createdAt ? new Date(createdAt) : new Date(),
    module: message.module,
    toolName: message.tool_name,
    result: message.result,
    entities,
    entitySpans,
    requiresConfirmation: Boolean(
      message.requires_confirmation || message.requires_input
    ),
    requiresInput: Boolean(message.requires_input),
    pendingConfirmation: message.pending_confirmation ?? null,
    uiActionType:
      message.ui_action_type ??
      metadata.ui_action_type ??
      message.ui_action?.type ??
      metadata.ui_action?.type ??
      null,
    uiAction: message.ui_action ?? metadata.ui_action ?? null,
  };
}

const ENTITY_ICON: Record<AiEntityType, typeof UserIcon> = {
  employee: UserIcon,
  leave_request: CalendarIcon,
  asset: Laptop,
  document: FileText,
  document_template: FileText,
  time_entry: Clock,
  notification: Bell,
};

const TOOL_RESULT_KEYS: { key: string; label: string; type: AiEntityType }[] = [
  { key: "employees", label: "Employees", type: "employee" },
  { key: "leave_requests", label: "Leave requests", type: "leave_request" },
  { key: "assets", label: "Assets", type: "asset" },
  { key: "documents", label: "Documents", type: "document" },
  { key: "time_entries", label: "Time entries", type: "time_entry" },
  { key: "notifications", label: "Notifications", type: "notification" },
];

function EntityLink({
  span,
  onNavigate,
}: {
  span: AiEntitySpan;
  onNavigate: (type: AiEntityType, id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(span.type, span.id)}
      className="cursor-pointer font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
    >
      {span.text}
    </button>
  );
}

// Inline parser that handles bold/code/link state crossing entity-token boundaries.
function renderInlineTokens(
  line: LinearToken[],
  keyPrefix: string,
  onEntityNavigate: (type: AiEntityType, id: number) => void
): ReactNode {
  type Frame = {
    kind: "root" | "bold" | "italic" | "code";
    children: ReactNode[];
  };
  const stack: Frame[] = [{ kind: "root", children: [] }];
  const top = () => stack[stack.length - 1];
  let counter = 0;
  const pushNode = (n: ReactNode) => top().children.push(n);
  const flushBuf = (buf: string) => {
    if (buf) pushNode(buf);
  };

  const openOrClose = (kind: "bold" | "italic" | "code") => {
    if (top().kind === kind) {
      const closed = stack.pop()!;
      counter += 1;
      if (kind === "bold")
        pushNode(
          <strong
            key={`${keyPrefix}-b-${counter}`}
            className="font-semibold text-gray-900 dark:text-gray-100"
          >
            {closed.children}
          </strong>
        );
      else if (kind === "italic")
        pushNode(
          <em key={`${keyPrefix}-i-${counter}`} className="italic">
            {closed.children}
          </em>
        );
      else {
        const text = closed.children
          .map((c) => (typeof c === "string" ? c : ""))
          .join("");
        pushNode(
          <code
            key={`${keyPrefix}-c-${counter}`}
            className="rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-[0.82em] text-gray-900 dark:bg-gray-700 dark:text-gray-100"
          >
            {text}
          </code>
        );
      }
    } else {
      stack.push({ kind, children: [] });
    }
  };

  for (const tok of line) {
    if (tok.kind === "entity") {
      counter += 1;
      pushNode(
        <EntityLink
          key={`${keyPrefix}-e-${counter}`}
          span={tok.entity}
          onNavigate={onEntityNavigate}
        />
      );
      continue;
    }
    const text = tok.text;
    let i = 0;
    let buf = "";
    while (i < text.length) {
      if (top().kind === "code") {
        if (text[i] === "`") {
          flushBuf(buf);
          buf = "";
          openOrClose("code");
          i += 1;
        } else {
          buf += text[i];
          i += 1;
        }
        continue;
      }
      if (text[i] === "*" && text[i + 1] === "*") {
        flushBuf(buf);
        buf = "";
        openOrClose("bold");
        i += 2;
      } else if (text[i] === "*") {
        flushBuf(buf);
        buf = "";
        openOrClose("italic");
        i += 1;
      } else if (text[i] === "`") {
        flushBuf(buf);
        buf = "";
        openOrClose("code");
        i += 1;
      } else {
        buf += text[i];
        i += 1;
      }
    }
    flushBuf(buf);
  }
  // Unwind unclosed frames; emit literal markers + children to avoid losing content
  while (stack.length > 1) {
    const closed = stack.pop()!;
    const marker =
      closed.kind === "bold" ? "**" : closed.kind === "code" ? "`" : "*";
    top().children.push(marker, ...closed.children);
  }
  return stack[0].children;
}

function lineToText(line: LinearToken[]): string {
  return line
    .map((t) => (t.kind === "entity" ? t.entity.text : t.text))
    .join("");
}

function stripPrefixFromLine(line: LinearToken[], re: RegExp): LinearToken[] {
  const out: LinearToken[] = [];
  let stripped = false;
  for (const tok of line) {
    if (stripped) {
      out.push(tok);
      continue;
    }
    if (tok.kind === "text") {
      const replaced = tok.text.replace(re, "");
      if (replaced !== tok.text) stripped = true;
      if (replaced.length > 0) out.push({ kind: "text", text: replaced });
    } else {
      out.push(tok);
      stripped = true;
    }
  }
  return out;
}

// Split a line's tokens at `|` characters into cell token arrays.
function splitLineByPipe(line: LinearToken[]): LinearToken[][] {
  const cells: LinearToken[][] = [[]];
  for (const tok of line) {
    if (tok.kind === "entity") {
      cells[cells.length - 1].push(tok);
      continue;
    }
    const parts = tok.text.split("|");
    parts.forEach((part, idx) => {
      if (idx > 0) cells.push([]);
      if (part.length > 0)
        cells[cells.length - 1].push({ kind: "text", text: part });
    });
  }
  // Trim leading/trailing empty cells (from `| ... |` borders)
  const trim = (arr: LinearToken[]): LinearToken[] => {
    const out = [...arr];
    while (out.length && out[0].kind === "text" && !out[0].text.trim())
      out.shift();
    while (
      out.length &&
      out[out.length - 1].kind === "text" &&
      !(out[out.length - 1] as { kind: "text"; text: string }).text.trim()
    )
      out.pop();
    return out;
  };
  const trimmed = cells.map(trim);
  if (trimmed.length > 1 && trimmed[0].length === 0) trimmed.shift();
  if (trimmed.length > 1 && trimmed[trimmed.length - 1].length === 0)
    trimmed.pop();
  return trimmed;
}

function isTableSeparator(text: string): boolean {
  const t = text.trim();
  if (!t.startsWith("|") && !t.includes("|")) return false;
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(t);
}

function isTableLine(text: string): boolean {
  const t = text.trim();
  if (!t.startsWith("|")) return false;
  return (t.match(/\|/g) ?? []).length >= 2;
}

type Block =
  | { kind: "p"; lines: LinearToken[][] }
  | { kind: "heading"; level: number; line: LinearToken[] }
  | { kind: "ul"; items: LinearToken[][] }
  | { kind: "ol"; items: LinearToken[][] }
  | { kind: "table"; header: LinearToken[][] | null; rows: LinearToken[][][] }
  | { kind: "break" };

function buildBlocks(lines: LinearToken[][]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const text = lineToText(line);
    const trimmed = text.trim();

    if (trimmed === "") {
      blocks.push({ kind: "break" });
      i += 1;
      continue;
    }

    const headingMatch = /^\s*(#{1,6})\s+/.exec(text);
    if (headingMatch) {
      blocks.push({
        kind: "heading",
        level: headingMatch[1].length,
        line: stripPrefixFromLine(line, /^\s*#{1,6}\s+/),
      });
      i += 1;
      continue;
    }

    if (isTableLine(text)) {
      const tableLines: LinearToken[][] = [];
      while (i < lines.length && isTableLine(lineToText(lines[i]))) {
        tableLines.push(lines[i]);
        i += 1;
      }
      // Detect header + separator
      let header: LinearToken[][] | null = null;
      let bodyStart = 0;
      if (
        tableLines.length >= 2 &&
        isTableSeparator(lineToText(tableLines[1]))
      ) {
        header = splitLineByPipe(tableLines[0]);
        bodyStart = 2;
      }
      const rows: LinearToken[][][] = [];
      for (let j = bodyStart; j < tableLines.length; j += 1) {
        if (isTableSeparator(lineToText(tableLines[j]))) continue;
        rows.push(splitLineByPipe(tableLines[j]));
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    const olMatch = /^\s*(\d+)\.\s+/.exec(text);
    if (olMatch) {
      const items: LinearToken[][] = [];
      while (i < lines.length) {
        const t = lineToText(lines[i]);
        const m = /^\s*\d+\.\s+/.exec(t);
        if (!m) break;
        items.push(stripPrefixFromLine(lines[i], /^\s*\d+\.\s+/));
        i += 1;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    if (/^\s*[-*]\s+/.test(text)) {
      const items: LinearToken[][] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lineToText(lines[i]))) {
        items.push(stripPrefixFromLine(lines[i], /^\s*[-*]\s+/));
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    const paraLines: LinearToken[][] = [line];
    i += 1;
    while (i < lines.length) {
      const t = lineToText(lines[i]);
      if (
        !t.trim() ||
        /^\s*#{1,6}\s+/.test(t) ||
        isTableLine(t) ||
        /^\s*\d+\.\s+/.test(t) ||
        /^\s*[-*]\s+/.test(t)
      )
        break;
      paraLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: "p", lines: paraLines });
  }
  return blocks;
}

function AssistantMessageBody({
  message,
  onEntityNavigate,
}: {
  message: ChatMessage;
  onEntityNavigate: (type: AiEntityType, id: number) => void;
}) {
  const tokens = useMemo<LinearToken[]>(
    () => spliceEntityTokens(message.content, message.entitySpans),
    [message.content, message.entitySpans]
  );

  const lines: LinearToken[][] = useMemo(() => {
    const out: LinearToken[][] = [[]];
    for (const tok of tokens) {
      if (tok.kind === "entity") {
        out[out.length - 1].push(tok);
        continue;
      }
      const parts = tok.text.split("\n");
      parts.forEach((part, idx) => {
        if (idx > 0) out.push([]);
        if (part.length > 0)
          out[out.length - 1].push({ kind: "text", text: part });
      });
    }
    return out;
  }, [tokens]);

  const blocks = useMemo(() => buildBlocks(lines), [lines]);

  return (
    <div className="space-y-2 text-[0.92rem] leading-relaxed">
      {blocks.map((block, idx) => {
        const key = `blk-${idx}`;
        if (block.kind === "break") {
          return <div key={key} className="h-1" />;
        }
        if (block.kind === "p") {
          return (
            <div key={key} className="space-y-1">
              {block.lines.map((ln, li) => (
                <div key={`${key}-l${li}`}>
                  {renderInlineTokens(ln, `${key}-l${li}`, onEntityNavigate)}
                </div>
              ))}
            </div>
          );
        }
        if (block.kind === "heading") {
          const headingClass =
            block.level <= 2
              ? "mt-1 text-base font-semibold text-gray-950 dark:text-gray-50"
              : "mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100";
          return (
            <div key={key} className={headingClass}>
              {renderInlineTokens(block.line, `${key}-h`, onEntityNavigate)}
            </div>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul
              key={key}
              className="ml-1 list-disc space-y-1 pl-4 marker:text-gray-400"
            >
              {block.items.map((item, ii) => (
                <li key={`${key}-i${ii}`} className="pl-1">
                  {renderInlineTokens(item, `${key}-i${ii}`, onEntityNavigate)}
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol
              key={key}
              className="ml-1 list-decimal space-y-1 pl-5 marker:text-gray-500 marker:font-medium"
            >
              {block.items.map((item, ii) => (
                <li key={`${key}-i${ii}`} className="pl-1">
                  {renderInlineTokens(item, `${key}-i${ii}`, onEntityNavigate)}
                </li>
              ))}
            </ol>
          );
        }
        // table
        return (
          <div
            key={key}
            className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <table className="w-full border-collapse text-xs">
              {block.header && (
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    {block.header.map((cell, ci) => (
                      <th
                        key={`${key}-h${ci}`}
                        className="border-b border-gray-200 px-2.5 py-1.5 text-left font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                      >
                        {renderInlineTokens(
                          cell,
                          `${key}-h${ci}`,
                          onEntityNavigate
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr
                    key={`${key}-r${ri}`}
                    className="even:bg-gray-50/60 dark:even:bg-gray-800/40"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={`${key}-r${ri}c${ci}`}
                        className="border-t border-gray-100 px-2.5 py-1.5 align-top text-gray-800 dark:border-gray-700 dark:text-gray-100"
                      >
                        {renderInlineTokens(
                          cell,
                          `${key}-r${ri}c${ci}`,
                          onEntityNavigate
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function EntityChipRail({
  entities,
  onNavigate,
}: {
  entities: AiEntity[];
  onNavigate: (type: AiEntityType, id: number) => void;
}) {
  if (entities.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entities.map((e) => {
        const Icon = ENTITY_ICON[e.type] ?? UserIcon;
        return (
          <button
            key={`${e.type}-${e.id}`}
            type="button"
            onClick={() => onNavigate(e.type, e.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-sm hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <Icon className="h-3.5 w-3.5 text-gray-500" />
            <span className="max-w-[180px] truncate">{e.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status.toLowerCase();
  let cls = "bg-gray-200 text-gray-800";
  if (/(approved|active|completed|done|paid)/.test(tone))
    cls = "bg-green-100 text-green-800";
  else if (/(pending|in.?progress|review)/.test(tone))
    cls = "bg-amber-100 text-amber-800";
  else if (/(rejected|cancel|expired|inactive)/.test(tone))
    cls = "bg-red-100 text-red-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

type Row = Record<string, JsonValue>;

function asRow(value: JsonValue): Row | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : null;
}

function strField(row: Row, key: string): string {
  const v = row[key];
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function numField(row: Row, key: string): number | null {
  const v = row[key];
  return typeof v === "number" ? v : null;
}

function ResultRow({
  type,
  row,
  onNavigate,
}: {
  type: AiEntityType;
  row: Row;
  onNavigate: (type: AiEntityType, id: number) => void;
}) {
  const id = numField(row, "id");
  const clickable = id != null;
  const onClick = () => {
    if (id != null) onNavigate(type, id);
  };
  const [nowMs] = useState(() => Date.now());

  const base =
    "flex flex-col gap-0.5 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700";
  const interactive = clickable
    ? " cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
    : "";

  if (type === "employee") {
    return (
      <div className={base + interactive} onClick={onClick}>
        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
          <UserIcon className="h-4 w-4 text-gray-500" />
          {strField(row, "name") || strField(row, "full_name") || `#${id}`}
        </div>
        <div className="text-xs text-gray-500">
          {[strField(row, "role"), strField(row, "department")]
            .filter(Boolean)
            .join(" • ")}
        </div>
        {strField(row, "email") && (
          <div className="text-xs text-gray-500">{strField(row, "email")}</div>
        )}
      </div>
    );
  }

  if (type === "leave_request") {
    return (
      <div className={base + interactive} onClick={onClick}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {strField(row, "leave_type") ||
              strField(row, "type") ||
              "Leave request"}
          </span>
          {strField(row, "status") && (
            <StatusBadge status={strField(row, "status")} />
          )}
        </div>
        <div className="text-xs text-gray-500">
          {strField(row, "start_date")} → {strField(row, "end_date")}
        </div>
        {strField(row, "employee_name") && (
          <div className="text-xs text-gray-500">
            {strField(row, "employee_name")}
          </div>
        )}
      </div>
    );
  }

  if (type === "asset") {
    return (
      <div className={base + interactive} onClick={onClick}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {strField(row, "name") || `Asset #${id}`}
          </span>
          {strField(row, "status") && (
            <StatusBadge status={strField(row, "status")} />
          )}
        </div>
        <div className="text-xs text-gray-500">
          {[strField(row, "asset_id"), strField(row, "serial_number")]
            .filter(Boolean)
            .join(" • ")}
        </div>
      </div>
    );
  }

  if (type === "document") {
    const expiry = strField(row, "expiry_date") || strField(row, "expires_at");
    const expired = expiry ? new Date(expiry).getTime() < nowMs : false;
    return (
      <div className={base + interactive} onClick={onClick}>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {strField(row, "name") || strField(row, "title") || `Document #${id}`}
        </div>
        <div className="text-xs text-gray-500">{strField(row, "category")}</div>
        {expiry && (
          <div
            className={`text-xs ${expired ? "text-red-600" : "text-gray-500"}`}
          >
            Expires {expiry}
          </div>
        )}
      </div>
    );
  }

  if (type === "time_entry") {
    return (
      <div className={base + interactive} onClick={onClick}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {strField(row, "date")}
          </span>
          <span className="text-xs text-gray-500">
            {strField(row, "hours")}h
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {[strField(row, "project"), strField(row, "task")]
            .filter(Boolean)
            .join(" • ")}
        </div>
        {strField(row, "status") && (
          <StatusBadge status={strField(row, "status")} />
        )}
      </div>
    );
  }

  // notification
  return (
    <div className={base + interactive} onClick={onClick}>
      <div className="flex items-center gap-2">
        {row.read === false && (
          <span className="h-2 w-2 rounded-full bg-blue-500" />
        )}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {strField(row, "title") || `Notification #${id}`}
        </span>
      </div>
      <div className="text-xs text-gray-500">{strField(row, "created_at")}</div>
    </div>
  );
}

function ToolResultCard({
  result,
  onEntityNavigate,
}: {
  result: JsonValue | undefined;
  onEntityNavigate: (type: AiEntityType, id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const row = asRow(result ?? null);
  if (!row) return null;

  const sections = TOOL_RESULT_KEYS.map((s) => {
    const v = row[s.key];
    const arr = Array.isArray(v) ? (v as JsonValue[]) : [];
    const rows = arr.map(asRow).filter((r): r is Row => r != null);
    return { ...s, rows };
  }).filter((s) => s.rows.length > 0);

  if (sections.length === 0) return null;

  const total = sections.reduce((acc, s) => acc + s.rows.length, 0);
  const title = sections.map((s) => s.label).join(", ");

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200"
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{title}</span>
        <span className="ml-auto text-gray-400">{total}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-gray-200 p-3 dark:border-gray-700">
          {sections.map((s) => (
            <div key={s.key} className="space-y-1.5">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                {s.label}
              </div>
              <div className="space-y-1.5">
                {s.rows.map((r, i) => (
                  <ResultRow
                    key={`${s.key}-${i}`}
                    type={s.type}
                    row={r}
                    onNavigate={onEntityNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmationCallout({
  pending,
  disabled,
  onConfirm,
  onCancel,
}: {
  pending: AiPendingConfirmation;
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const args = pending.arguments ?? {};
  const entries = Object.entries(args);
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-700" />
        <span className="text-xs font-semibold text-amber-900">
          Confirmation required
        </span>
        {pending.tool_name && (
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[0.7rem] text-amber-900">
            {pending.tool_name}
          </code>
        )}
      </div>
      {pending.description && (
        <p className="text-xs text-amber-900">{pending.description}</p>
      )}
      {entries.length > 0 && (
        <div className="overflow-hidden rounded border border-amber-200 bg-white">
          <table className="w-full text-left text-xs">
            <tbody>
              {entries.map(([k, v]) => (
                <tr
                  key={k}
                  className="border-b border-amber-100 last:border-b-0"
                >
                  <td className="bg-amber-50/50 px-2 py-1 font-medium text-amber-900">
                    {k}
                  </td>
                  <td className="px-2 py-1 font-mono text-gray-800">
                    {typeof v === "object"
                      ? JSON.stringify(v)
                      : String(v ?? "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={disabled}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

function MessageDetails({ message }: { message: ChatMessage }) {
  const hasDetails = Boolean(message.module) || Boolean(message.toolName);

  if (!hasDetails) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-300/50 pt-3 text-xs">
      {message.module && (
        <Badge className="border border-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800">
          Module: {message.module}
        </Badge>
      )}
      {message.toolName && (
        <Badge className="border border-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800">
          Tool: {message.toolName}
        </Badge>
      )}
    </div>
  );
}

function ConfirmationActions({
  disabled,
  onConfirm,
  onCancel,
}: {
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <AlertCircle className="h-4 w-4 text-amber-700" />
      <span className="mr-auto text-xs font-medium text-amber-900">
        Confirmation required
      </span>
      <Button
        size="sm"
        variant="primary"
        disabled={disabled}
        onClick={onConfirm}
      >
        Confirm
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}

function UiActionCard({
  action,
  disabled,
  busy,
  onConfirm,
  onCancel,
}: {
  action: AiUiAction;
  disabled: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { secondsLeft, isExpired } = usePendingExpiry(action.expires_at);
  const blocked = disabled || busy || isExpired;
  const entries = Object.entries(action.arguments ?? {});
  const isApproval = action.type === "approval";

  return (
    <div
      className={`mt-3 rounded-lg border bg-amber-50 p-3 ${
        isExpired ? "border-red-200" : "border-amber-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-700" />
        <span className="text-xs font-semibold text-amber-900">
          {action.label ??
            (isApproval ? "Approval required" : "Confirmation required")}
        </span>
        {action.tool_name && (
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[0.7rem] text-amber-900">
            {action.tool_name}
          </code>
        )}
        {action.module && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium text-gray-700">
            {action.module}
          </span>
        )}
        {action.expires_at && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
              isExpired
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {isExpired
              ? "expired"
              : secondsLeft == null
                ? "active"
                : `expires in ${Math.max(1, Math.ceil(secondsLeft / 60))}m`}
          </span>
        )}
      </div>
      {action.help && (
        <p className="mt-2 text-xs text-amber-900">{action.help}</p>
      )}
      {entries.length > 0 && (
        <div className="mt-3 overflow-hidden rounded border border-amber-200 bg-white">
          <table className="w-full text-left text-xs">
            <tbody>
              {entries.map(([key, value]) => (
                <tr
                  key={key}
                  className="border-b border-amber-100 last:border-b-0"
                >
                  <td className="w-1/3 bg-amber-50/50 px-2 py-1.5 font-medium text-amber-900">
                    {humanizeKey(key)}
                  </td>
                  <td className="px-2 py-1.5 text-gray-800">
                    {formatActionValue(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={blocked}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={blocked}
          onClick={onConfirm}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isApproval ? (
            "Approve"
          ) : (
            "Confirm"
          )}
        </Button>
      </div>
    </div>
  );
}

export function AIAssistant({ onModuleNavigate }: AIAssistantProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<AiChatSessionSummary[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quickActionMessageId, setQuickActionMessageId] = useState<
    string | null
  >(null);
  const [completedQuickActions, setCompletedQuickActions] = useState<
    Record<string, boolean>
  >({});
  const [hasLoadedSessions, setHasLoadedSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;

  const latestConfirmation = useMemo(
    () =>
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" && message.requiresConfirmation
        ),
    [messages]
  );

  const latestApprovalPrompt = useMemo(
    () =>
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" &&
            !message.requiresConfirmation &&
            !message.uiAction &&
            !completedQuickActions[message.id] &&
            approvalRequestIdFromText(message.content)
        ),
    [completedQuickActions, messages]
  );

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages, isOpen, isSending]);

  useEffect(() => {
    if (!isOpen || hasLoadedSessions || isLoadingSessions) return;
    void refreshSessions();
  }, [isOpen, hasLoadedSessions, isLoadingSessions]);

  const createMessageId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  const refreshSessions = async () => {
    setIsLoadingSessions(true);
    setErrorMessage(null);
    try {
      setSessions(await listAiChatSessions());
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setHasLoadedSessions(true);
      setIsLoadingSessions(false);
    }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([welcomeMessage]);
    setInputValue("");
    setErrorMessage(null);
  };

  const loadSession = async (sessionId: number) => {
    setIsLoadingHistory(true);
    setErrorMessage(null);
    try {
      const detail = await getAiChatSession(sessionId);
      const history = (detail.messages ?? []).map(historyToMessage);
      setActiveSessionId(sessionId);
      setMessages(history.length > 0 ? history : [welcomeMessage]);
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const archiveSession = async (sessionId: number) => {
    setErrorMessage(null);
    try {
      await deleteAiChatSession(sessionId);
      setSessions((prev) =>
        prev.filter((session) => getSessionId(session) !== sessionId)
      );
      if (activeSessionId === sessionId) startNewChat();
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const appendAssistantResponse = (
    response: AiChatResponse,
    sourceUserMessage?: string
  ) => {
    setActiveSessionId(response.session_id);
    const next = responseToMessage(response);
    if (sourceUserMessage) next.sourceUserMessage = sourceUserMessage;
    setMessages((prev) => {
      // Supersede any prior live pending cards.
      const marked = prev.map((m) =>
        m.role === "assistant" &&
        (m.requiresConfirmation || Boolean(m.uiAction)) &&
        !m.superseded
          ? { ...m, superseded: true }
          : m
      );
      return [...marked, next];
    });
    void refreshSessions();
  };

  interface SendOptions {
    confirm?: boolean;
    confirmArguments?: Record<string, JsonValue>;
    suppressUserBubble?: boolean;
    targetMessageId?: string;
    sourceUserMessage?: string;
  }

  const sendMessage = async (messageText: string, opts: SendOptions = {}) => {
    const trimmed = messageText.trim();
    if (isSending) return;
    if (!trimmed && !opts.confirm) return;

    setErrorMessage(null);
    setIsSending(true);

    if (!opts.suppressUserBubble && trimmed) {
      const userMessage: ChatMessage = {
        id: createMessageId("user"),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    try {
      const response = await sendAiChatMessage({
        ...(trimmed ? { message: trimmed } : {}),
        ...(activeSessionId ? { session_id: activeSessionId } : {}),
        ...(opts.confirm ? { confirm: true } : {}),
        ...(opts.confirmArguments ? { arguments: opts.confirmArguments } : {}),
      });
      appendAssistantResponse(
        response,
        opts.sourceUserMessage ?? (opts.confirm ? undefined : trimmed)
      );
      // Clear any previous confirm error on the target message
      if (opts.targetMessageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === opts.targetMessageId
              ? { ...m, fieldErrors: undefined, confirmError: null }
              : m
          )
        );
      }
    } catch (error) {
      if (
        opts.targetMessageId &&
        error instanceof AiChatApiError &&
        error.status === 400
      ) {
        // Attach field-level errors to the pending card; keep card live.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === opts.targetMessageId
              ? {
                  ...m,
                  fieldErrors: error.fieldErrors,
                  confirmError:
                    error.fieldErrors.confirm ||
                    error.fieldErrors.arguments ||
                    error.message,
                }
              : m
          )
        );
      } else {
        setErrorMessage(formatError(error));
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId("assistant-error"),
            role: "assistant",
            content: formatError(error),
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsSending(false);
      if (!opts.confirm && !opts.suppressUserBubble) setInputValue("");
    }
  };

  const confirmPendingForMessage = (
    messageId: string,
    editedArguments: Record<string, JsonValue>
  ) => {
    if (!activeSessionId) {
      setErrorMessage("No active chat session for confirmation.");
      return;
    }
    void sendMessage("", {
      confirm: true,
      confirmArguments: editedArguments,
      suppressUserBubble: true,
      targetMessageId: messageId,
    });
  };

  const reaskAssistant = (sourcePrompt: string | undefined) => {
    const prompt = (sourcePrompt ?? "").trim();
    if (!prompt) return;
    void sendMessage(prompt);
  };

  const cancelPendingForMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              requiresConfirmation: false,
              pendingConfirmation: null,
              fieldErrors: undefined,
              confirmError: null,
            }
          : m
      )
    );
  };

  const cancelUiActionForMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, superseded: true } : m))
    );
    void sendMessage("cancel", { suppressUserBubble: true });
  };

  const denyPendingForMessage = (messageId: string) => {
    if (!activeSessionId) {
      cancelPendingForMessage(messageId);
      return;
    }
    // Mark card cleared optimistically; backend natural-language cancel will
    // reply with the confirmation bubble.
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, requiresConfirmation: false, pendingConfirmation: null }
          : m
      )
    );
    void sendMessage("no", { suppressUserBubble: true });
  };

  const approveLeaveFromMessage = async (message: ChatMessage) => {
    const leaveRequestId = approvalRequestIdFromText(message.content);
    if (!leaveRequestId) return false;

    if (!accessToken) {
      setErrorMessage("No active session token for approval.");
      return true;
    }

    setErrorMessage(null);
    setQuickActionMessageId(message.id);
    try {
      const approved = isHrFinalApprovalText(message.content)
        ? await hrApproveLeaveRequest(leaveRequestId, "", accessToken)
        : await approveLeaveRequest(leaveRequestId, "", accessToken);
      const approvalLabel = isHrFinalApprovalText(message.content)
        ? "HR final approved"
        : "Approved";
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("assistant-approval"),
          role: "assistant",
          content: `${approvalLabel} leave request #${approved.id}.`,
          timestamp: new Date(),
          module: "vacations",
        },
      ]);
      setCompletedQuickActions((prev) => ({ ...prev, [message.id]: true }));
    } catch (error) {
      setErrorMessage(formatError(error));
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("assistant-error"),
          role: "assistant",
          content: formatError(error),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setQuickActionMessageId(null);
    }

    return true;
  };

  const submitInput = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending || quickActionMessageId) return;

    if (latestApprovalPrompt && isApprovalConfirmation(trimmed)) {
      const userMessage: ChatMessage = {
        id: createMessageId("user"),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      await approveLeaveFromMessage(latestApprovalPrompt);
      return;
    }

    void sendMessage(inputValue);
  };

  const navigateToEntity = (type: AiEntityType, id: number) => {
    if (type === "document" && typeof window !== "undefined") {
      sessionStorage.setItem("bh.openDocumentId", String(id));
      window.dispatchEvent(
        new CustomEvent("bh:openDocument", { detail: { id } })
      );
    }
    if (type === "document_template" && typeof window !== "undefined") {
      sessionStorage.setItem("bh.openDocumentTemplateId", String(id));
      window.dispatchEvent(
        new CustomEvent("bh:openDocumentTemplate", { detail: { id } })
      );
    }
    onModuleNavigate(entityModule(type), id);
    setIsOpen(false);
  };

  const confirmPendingAction = () => {
    if (!latestConfirmation) return;
    confirmPendingForMessage(latestConfirmation.id, {});
  };

  const cancelPendingAction = () => {
    if (latestConfirmation) cancelPendingForMessage(latestConfirmation.id);
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId("cancel"),
        role: "assistant",
        content: "Action cancelled. No changes were made.",
        timestamp: new Date(),
      },
    ]);
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 rounded-xl border border-gray-200 transition-colors hover:bg-gray-100"
      >
        <Command className="h-5 w-5 text-gray-600" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-xl border border-gray-200 transition-colors hover:bg-gray-100"
          aria-label="Open AI assistant"
        >
          <Command className="h-5 w-5 text-gray-600" />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[92vh] max-h-[calc(100vh-2rem)] w-[96vw] max-w-[1400px] gap-0 overflow-hidden rounded-xl border border-gray-200 p-0 shadow-2xl dark:border-gray-700">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-gray-200 bg-gray-50 lg:flex dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Chats
              </p>
              <p className="text-xs text-gray-500">Session history</p>
            </div>
            <Button size="icon" variant="ghost" onClick={startNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={refreshSessions}
              disabled={isLoadingSessions}
            >
              {isLoadingSessions ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
            <div className="space-y-1">
              {sessions.map((session) => {
                const sessionId = getSessionId(session);
                const isActive = activeSessionId === sessionId;
                return (
                  <div
                    key={sessionId}
                    className={`group flex items-center gap-1 rounded-lg ${
                      isActive ? "bg-gray-200 dark:bg-gray-800" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 px-3 py-2 text-left"
                      onClick={() => loadSession(sessionId)}
                      disabled={isLoadingHistory}
                    >
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getSessionTitle(session)}
                      </p>
                      {session.updated_at && (
                        <p className="truncate text-xs text-gray-500">
                          {new Date(session.updated_at).toLocaleString()}
                        </p>
                      )}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="mr-1 h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => archiveSession(sessionId)}
                      aria-label="Delete chat session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}

              {!isLoadingSessions && sessions.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  No previous chats.
                </p>
              )}
            </div>
          </ScrollArea>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-100 px-6 py-4 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg text-gray-900 dark:text-gray-100">
                  BloomHub AI Assistant
                </span>
                <span className="flex items-center gap-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  <Sparkles className="h-4 w-4" />
                  {activeSessionId ? `Session #${activeSessionId}` : "New chat"}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="lg:hidden"
                  onClick={refreshSessions}
                  disabled={isLoadingSessions}
                >
                  <RefreshCw className="h-4 w-4" />
                  History
                </Button>
                <Button size="sm" variant="outline" onClick={startNewChat}>
                  <Plus className="h-4 w-4" />
                  New chat
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1">
            <section className="flex min-w-0 flex-1 flex-col">
              {errorMessage && (
                <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="rounded p-0.5 hover:bg-red-100"
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-5 px-6 py-5">
                  {isLoadingHistory && (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading chat history...
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[78%] ${
                          message.role === "user" ? "order-1" : "order-2"
                        }`}
                      >
                        <div
                          className={`rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            message.role === "user"
                              ? "rounded-br-sm bg-gray-900 text-white"
                              : "rounded-bl-sm border border-gray-200 bg-gray-100 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <AssistantMessageBody
                              message={message}
                              onEntityNavigate={navigateToEntity}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">
                              {message.content}
                            </div>
                          )}
                          {message.role === "assistant" && (
                            <EntityChipRail
                              entities={dedupeEntities(message.entities)}
                              onNavigate={navigateToEntity}
                            />
                          )}
                          {message.role === "assistant" && (
                            <ToolResultCard
                              result={message.result}
                              onEntityNavigate={navigateToEntity}
                            />
                          )}
                          {isHrModuleId(message.module) &&
                            (() => {
                              const moduleId = message.module;
                              return (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="mt-3 bg-white/80 text-xs"
                                  onClick={() => {
                                    onModuleNavigate(moduleId);
                                    setIsOpen(false);
                                  }}
                                >
                                  Open {moduleId}
                                </Button>
                              );
                            })()}
                          <MessageDetails message={message} />
                          {message.uiActionType === "form" &&
                            message.uiAction &&
                            !message.superseded && (
                              <PendingConfirmationCard
                                pending={uiActionToPending(message.uiAction)}
                                superseded={message.superseded}
                                disabled={isSending}
                                requiresInput
                                fieldErrors={message.fieldErrors}
                                topLevelError={message.confirmError}
                                submitFullArguments
                                onApprove={(args) =>
                                  confirmPendingForMessage(message.id, args)
                                }
                                onDeny={() =>
                                  cancelUiActionForMessage(message.id)
                                }
                              />
                            )}
                          {(message.uiActionType === "approval" ||
                            message.uiActionType === "confirmation") &&
                            message.uiAction &&
                            !message.superseded && (
                              <UiActionCard
                                action={message.uiAction}
                                disabled={isSending}
                                busy={quickActionMessageId === message.id}
                                onConfirm={() =>
                                  confirmPendingForMessage(message.id, {})
                                }
                                onCancel={() =>
                                  cancelUiActionForMessage(message.id)
                                }
                              />
                            )}
                          {!message.uiAction &&
                            message.requiresConfirmation &&
                            message.pendingConfirmation?.args_schema && (
                              <PendingConfirmationCard
                                pending={message.pendingConfirmation}
                                superseded={message.superseded}
                                disabled={isSending}
                                requiresInput={message.requiresInput}
                                fieldErrors={message.fieldErrors}
                                topLevelError={message.confirmError}
                                onApprove={(args) =>
                                  confirmPendingForMessage(message.id, args)
                                }
                                onDeny={() => denyPendingForMessage(message.id)}
                                onReask={() =>
                                  reaskAssistant(message.sourceUserMessage)
                                }
                              />
                            )}
                          {!message.uiAction &&
                            message.requiresConfirmation &&
                            message.pendingConfirmation &&
                            !message.pendingConfirmation.args_schema && (
                              <ConfirmationCallout
                                pending={message.pendingConfirmation}
                                disabled={isSending}
                                onConfirm={confirmPendingAction}
                                onCancel={cancelPendingAction}
                              />
                            )}
                          {!message.uiAction &&
                            message.requiresConfirmation &&
                            !message.pendingConfirmation && (
                              <ConfirmationActions
                                disabled={isSending}
                                onConfirm={confirmPendingAction}
                                onCancel={cancelPendingAction}
                              />
                            )}
                          {message.role === "assistant" &&
                            !message.uiAction &&
                            !message.requiresConfirmation &&
                            !completedQuickActions[message.id] &&
                            approvalRequestIdFromText(message.content) && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <AlertCircle className="h-4 w-4 text-amber-700" />
                                <span className="mr-auto text-xs font-medium text-amber-900">
                                  Approval ready
                                </span>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={
                                    isSending ||
                                    quickActionMessageId === message.id
                                  }
                                  onClick={() =>
                                    approveLeaveFromMessage(message)
                                  }
                                >
                                  {quickActionMessageId === message.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isHrFinalApprovalText(message.content) ? (
                                    "Final approve"
                                  ) : (
                                    "Approve"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isSending ||
                                    quickActionMessageId === message.id
                                  }
                                  onClick={() =>
                                    setCompletedQuickActions((prev) => ({
                                      ...prev,
                                      [message.id]: true,
                                    }))
                                  }
                                >
                                  Deny
                                </Button>
                              </div>
                            )}
                        </div>
                        <div className="mt-2 px-1 text-xs text-gray-400">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isSending && <ThinkingIndicator />}

                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </ScrollArea>

              <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-3 flex flex-wrap gap-2">
                  {[
                    "show my leave balance",
                    "show pending vacation requests",
                  ].map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      onClick={() => setInputValue(prompt)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {prompt}
                    </Button>
                  ))}
                </div>

                <div className="flex items-end gap-3">
                  <Textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submitInput();
                      }
                    }}
                    placeholder="Ask BloomHub AI..."
                    className="max-h-32 min-h-12 flex-1 rounded-xl border-gray-300 bg-white px-4 py-3 focus-visible:ring-gray-200 dark:bg-gray-800"
                    disabled={isSending}
                  />
                  <Button
                    variant="primary"
                    className="h-12 rounded-xl px-5"
                    onClick={() => void submitInput()}
                    disabled={
                      !inputValue.trim() || isSending || !!quickActionMessageId
                    }
                  >
                    {isSending || quickActionMessageId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
