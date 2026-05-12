import { beforeEach, describe, expect, it, vi } from "vitest";
import { documentsApi } from "@/lib/api/modules/documents";
import { SignatureStatus } from "@/lib/documents/documentsHelpers";
import { fetchWithAuthRetry } from "@/lib/api/refresh";

vi.mock("@/lib/api/refresh", () => ({
  fetchWithAuthRetry: vi.fn(),
}));

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

describe("documentsApi signature mapping", () => {
  beforeEach(() => {
    vi.mocked(fetchWithAuthRetry).mockReset();
  });

  it("maps signed_at and requested_at from document signer payloads", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse([
        {
          id: 42,
          name: "Offer letter",
          file_name: "offer.pdf",
          signature_status: SignatureStatus.Pending,
          signers: [
            {
              name: "Ada Lovelace",
              email: "ada@example.com",
              status: "signed",
              signed_at: "2026-05-10T10:00:00Z",
              requested_at: "2026-05-09T10:00:00Z",
              last_reminded_at: "2026-05-09T12:00:00Z",
            },
          ],
        },
      ])
    );

    const [document] = await documentsApi.list();

    expect(document.signers[0]).toMatchObject({
      signedAt: "2026-05-10T10:00:00Z",
      requestedAt: "2026-05-09T10:00:00Z",
      lastRemindedAt: "2026-05-09T12:00:00Z",
    });
  });

  it("maps wrapped sign document responses", async () => {
    vi.mocked(fetchWithAuthRetry).mockResolvedValue(
      jsonResponse({
        document: {
          id: 42,
          name: "Offer letter",
          file_name: "offer.pdf",
          signature_status: SignatureStatus.Signed,
          signers: [
            {
              name: "Ada Lovelace",
              email: "ada@example.com",
              status: "signed",
              signed_at: "2026-05-10T10:00:00Z",
            },
          ],
        },
      })
    );

    const document = await documentsApi.signDocument(42, {
      signer_email: "ada@example.com",
      signature: {
        type: "typed_name",
        value: "Ada Lovelace",
        accepted_terms: true,
      },
    });

    expect(document.signatureStatus).toBe(SignatureStatus.Signed);
    expect(document.signers[0].signedAt).toBe("2026-05-10T10:00:00Z");
  });
});
