import { getApiBaseUrl } from "@/lib/config";
import { fetchWithAuthRetry } from "@/lib/api/refresh";
import { getHeaders } from "@/lib/api/helpers/httpClient";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

// Mock dependencies
vi.mock("@/lib/config", () => ({
  getApiBaseUrl: vi.fn(() => "https://example.com"),
}));

vi.mock("@/lib/api/refresh", () => ({
  fetchWithAuthRetry: vi.fn(),
}));

vi.mock("@/lib/api/helpers/httpClient", () => ({
  getHeaders: vi.fn(() => ({ "Content-Type": "application/json" })),
}));

describe("AiChatApiError", () => {
  it("should create an error with status, message, and fieldErrors", () => {
    const error = new AiChatApiError(400, "Bad request", { field: "error" });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AiChatApiError");
    expect(error.status).toBe(400);
    expect(error.message).toBe("Bad request");
    expect(error.fieldErrors).toEqual({ field: "error" });
  });

  it("should default fieldErrors to empty object", () => {
    const error = new AiChatApiError(500, "Server error");
    expect(error.fieldErrors).toEqual({});
  });
});

describe("extractFieldErrors", () => {
  it("should return empty object for non-object input", () => {
    expect(extractFieldErrors(null)).toEqual({});
    expect(extractFieldErrors("string")).toEqual({});
    expect(extractFieldErrors(123)).toEqual({});
  });

  it("should skip detail and message keys", () => {
    const body = { detail: "error", message: "msg", field: "value" };
    expect(extractFieldErrors(body)).toEqual({ field: "value" });
  });

  it("should join array values with comma", () => {
    const body = { field: ["a", "b", "c"] };
    expect(extractFieldErrors(body)).toEqual({ field: "a, b, c" });
  });

  it("should stringify non-string values", () => {
    const body = { field: 123 };
    expect(extractFieldErrors(body)).toEqual({ field: "123" });
  });
});

describe("extractErrorMessage", () => {
  it("should return detail field if present", () => {
    const body = { detail: "Detailed error" };
    expect(extractErrorMessage(body, 400)).toBe("Detailed error");
  });

  it("should return message field if present", () => {
    const body = { message: "Error message" };
    expect(extractErrorMessage(body, 400)).toBe("Error message");
  });

  it("should build error from field errors", () => {
    const body = { field1: "error1", field2: ["e2a", "e2b"] };
    const msg = extractErrorMessage(body, 400);
    expect(msg).toContain("field1: error1");
    expect(msg).toContain("field2: e2a, e2b");
  });

  it("should return default message for 400", () => {
    expect(extractErrorMessage(null, 400)).toBe(
      "Request was not valid. Check message and try again."
    );
  });

  it("should return default message for 401", () => {
    expect(extractErrorMessage(null, 401)).toBe(
      "Session expired. Sign in again to use AI assistant."
    );
  });

  it("should return default message for 403", () => {
    expect(extractErrorMessage(null, 403)).toBe(
      "You do not have permission to use this assistant."
    );
  });

  it("should return default message for 500+", () => {
    expect(extractErrorMessage(null, 500)).toBe(
      "AI service failed. Try again in a moment."
    );
    expect(extractErrorMessage(null, 503)).toBe(
      "AI service failed. Try again in a moment."
    );
  });

  it("should return generic message for unknown status", () => {
    expect(extractErrorMessage(null, 418)).toBe("AI assistant request failed.");
  });
});

describe("parseResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse successful response", async () => {
    const response = {
      ok: true,
      json: vi.fn().mockResolvedValue({ data: "test" }),
    } as unknown as Response;
    const result = await parseResponse<{ data: string }>(response);
    expect(result).toEqual({ data: "test" });
  });

  it("should throw AiChatApiError on non-ok response", async () => {
    const response = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ detail: "Bad request" }),
    } as unknown as Response;
    await expect(parseResponse(response)).rejects.toThrow(AiChatApiError);
    await expect(parseResponse(response)).rejects.toMatchObject({
      status: 400,
      message: "Bad request",
    });
  });

  it("should handle JSON parse failure", async () => {
    const response = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("parse error")),
    } as unknown as Response;
    await expect(parseResponse(response)).rejects.toThrow(AiChatApiError);
    await expect(parseResponse(response)).rejects.toMatchObject({
      status: 500,
      message: "AI service failed. Try again in a moment.",
    });
  });
});

describe("sendAiChatMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send POST request with correct URL and headers", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ session_id: 1, message: "Hello" }),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    const request: AiChatRequest = { message: "Hello" };
    const result = await sendAiChatMessage(request);

    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      "https://example.com/api/ai/chat/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }
    );
    expect(result).toEqual({ session_id: 1, message: "Hello" });
  });

  it("should throw AiChatApiError on failure", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ detail: "Unauthorized" }),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    await expect(sendAiChatMessage({ message: "test" })).rejects.toThrow(
      AiChatApiError
    );
  });
});

describe("listAiChatSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return array when response is an array", async () => {
    const sessions = [{ id: 1, title: "Session 1" }];
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(sessions),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    const result = await listAiChatSessions();
    expect(result).toEqual(sessions);
  });

  it("should return results array when response has results key", async () => {
    const sessions = [{ id: 1, title: "Session 1" }];
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ results: sessions }),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    const result = await listAiChatSessions();
    expect(result).toEqual(sessions);
  });

  it("should return empty array when no results", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    const result = await listAiChatSessions();
    expect(result).toEqual([]);
  });
});

describe("getAiChatSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch session by id", async () => {
    const session = { id: 1, title: "Session 1", messages: [] };
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(session),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    const result = await getAiChatSession(1);
    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      "https://example.com/api/ai/chat/sessions/1/",
      { headers: { "Content-Type": "application/json" } }
    );
    expect(result).toEqual(session);
  });
});

describe("deleteAiChatSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send DELETE request", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(undefined),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    await deleteAiChatSession(1);
    expect(fetchWithAuthRetry).toHaveBeenCalledWith(
      "https://example.com/api/ai/chat/sessions/1/",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  it("should throw AiChatApiError on failure", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ detail: "Not found" }),
    } as unknown as Response;
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(mockResponse);

    await expect(deleteAiChatSession(1)).rejects.toThrow(AiChatApiError);
  });
});

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
