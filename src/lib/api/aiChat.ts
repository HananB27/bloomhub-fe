import { getApiBaseUrl } from "@/lib/config";
import { fetchWithAuthRetry } from "@/lib/api/refresh";
import { getHeaders } from "@/lib/api/helpers/httpClient";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface AiChatRequest {
  message?: string;
  session_id?: number;
  tool_name?: string;
  arguments?: Record<string, JsonValue>;
  confirm?: boolean;
}

export type AiEntityType =
  | "employee"
  | "leave_request"
  | "asset"
  | "document"
  | "document_template"
  | "time_entry"
  | "notification";

export interface AiEntity {
  type: AiEntityType;
  id: number;
  name: string;
  email?: string;
  url: string;
}

export interface AiEntitySpan {
  type: AiEntityType;
  id: number;
  url: string;
  start: number;
  end: number;
  text: string;
}

export interface AiPendingConfirmation {
  tool_name?: string;
  module?: string;
  mutating?: boolean;
  sensitive?: boolean;
  description?: string;
  confirmation_label?: string;
  confirmation_help?: string;
  question?: string;
  missing_fields?: string[];
  arguments?: Record<string, JsonValue>;
  proposed_arguments?: Record<string, JsonValue>;
  args_schema?: Record<string, JsonValue>;
  examples?: Record<string, JsonValue>[];
  created_at?: string;
  expires_at?: string;
  [key: string]:
    | JsonValue
    | undefined
    | Record<string, JsonValue>[]
    | Record<string, JsonValue>;
}

export type AiUiActionType = "message" | "form" | "approval" | "confirmation";

export interface AiUiAction {
  type?: AiUiActionType;
  tool_name?: string;
  module?: string;
  label?: string;
  help?: string;
  arguments?: Record<string, JsonValue>;
  args_schema?: Record<string, JsonValue>;
  expires_at?: string;
  [key: string]: JsonValue | undefined | Record<string, JsonValue>;
}

export interface AiChatResponse {
  session_id: number;
  message: string;
  tool_name?: string | null;
  module?: string | null;
  result?: JsonValue;
  entities?: AiEntity[];
  entity_spans?: AiEntitySpan[];
  requires_confirmation?: boolean;
  requires_input?: boolean;
  pending_confirmation?: AiPendingConfirmation | null;
  ui_action_type?: AiUiActionType | null;
  ui_action?: AiUiAction | null;
}

export interface AiChatSessionSummary {
  id: number;
  session_id?: number;
  title?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message?: string | null;
}

export interface AiChatHistoryMessage {
  id?: number | string;
  role?: string;
  type?: string;
  sender?: string;
  message?: string;
  content?: string;
  created_at?: string | null;
  timestamp?: string | null;
  module?: string | null;
  tool_name?: string | null;
  result?: JsonValue;
  requires_confirmation?: boolean;
  requires_input?: boolean;
  pending_confirmation?: AiPendingConfirmation | null;
  ui_action_type?: AiUiActionType | null;
  ui_action?: AiUiAction | null;
  metadata?: {
    entities?: AiEntity[];
    entity_spans?: AiEntitySpan[];
    ui_action_type?: AiUiActionType | null;
    ui_action?: AiUiAction | null;
    [key: string]:
      | JsonValue
      | AiEntity[]
      | AiEntitySpan[]
      | AiUiAction
      | undefined
      | null;
  };
  entities?: AiEntity[];
  entity_spans?: AiEntitySpan[];
}

export interface AiChatSessionDetail extends AiChatSessionSummary {
  messages?: AiChatHistoryMessage[];
}

export class AiChatApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {}
  ) {
    super(message);
    this.name = "AiChatApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function extractFieldErrors(body: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof body !== "object" || body === null) return out;
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (k === "detail" || k === "message") continue;
    if (Array.isArray(v)) {
      out[k] = v
        .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
        .join(", ");
    } else if (typeof v === "string") {
      out[k] = v;
    }
  }
  return out;
}

const baseUrl = () => getApiBaseUrl();

function extractErrorMessage(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;

    const fieldErrors = Object.entries(record)
      .filter(([, value]) => Array.isArray(value) || typeof value === "string")
      .map(
        ([key, value]) =>
          `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
      );

    if (fieldErrors.length > 0) return fieldErrors.join("; ");
  }

  if (status === 400)
    return "Request was not valid. Check message and try again.";
  if (status === 401)
    return "Session expired. Sign in again to use AI assistant.";
  if (status === 403)
    return "You do not have permission to use this assistant.";
  if (status >= 500) return "AI service failed. Try again in a moment.";
  return "AI assistant request failed.";
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new AiChatApiError(
      response.status,
      extractErrorMessage(body, response.status),
      extractFieldErrors(body)
    );
  }

  return body as T;
}

export async function sendAiChatMessage(
  request: AiChatRequest
): Promise<AiChatResponse> {
  const response = await fetchWithAuthRetry(`${baseUrl()}/api/ai/chat/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  return parseResponse<AiChatResponse>(response);
}

export async function listAiChatSessions(): Promise<AiChatSessionSummary[]> {
  const response = await fetchWithAuthRetry(
    `${baseUrl()}/api/ai/chat/sessions/`,
    { headers: getHeaders() }
  );
  const data = await parseResponse<
    AiChatSessionSummary[] | { results?: AiChatSessionSummary[] }
  >(response);

  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function getAiChatSession(
  id: number
): Promise<AiChatSessionDetail> {
  const response = await fetchWithAuthRetry(
    `${baseUrl()}/api/ai/chat/sessions/${id}/`,
    { headers: getHeaders() }
  );

  return parseResponse<AiChatSessionDetail>(response);
}

export async function deleteAiChatSession(id: number): Promise<void> {
  const response = await fetchWithAuthRetry(
    `${baseUrl()}/api/ai/chat/sessions/${id}/`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new AiChatApiError(
      response.status,
      extractErrorMessage(body, response.status),
      extractFieldErrors(body)
    );
  }
}
