import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SignatureStatusBadge } from "@/components/hr-dashboard/documents/SignatureStatusBadge";
import { validateSignatureForm } from "@/components/hr-dashboard/documents/SignatureDialog";
import { validateSelectedSigners } from "@/components/hr-dashboard/documents/SignatureRequestDialog";
import { SignatureStatus } from "@/lib/documents/documentsHelpers";

describe("SignatureStatusBadge", () => {
  it("renders signed status with an accessible label", () => {
    render(<SignatureStatusBadge status={SignatureStatus.Signed} />);

    expect(
      screen.getByLabelText("Signature status: Signed")
    ).toBeInTheDocument();
    expect(screen.getByText("Signed")).toBeInTheDocument();
  });

  it("renders pending progress when signer counts are available", () => {
    render(
      <SignatureStatusBadge
        status={SignatureStatus.Pending}
        signedCount={1}
        totalCount={2}
      />
    );

    expect(
      screen.getByLabelText("Signature status: Pending, 1/2 signed")
    ).toBeInTheDocument();
    expect(screen.getByText("1/2 signed")).toBeInTheDocument();
  });

  it("renders unsigned distinctly from signed", () => {
    render(<SignatureStatusBadge status={SignatureStatus.NotRequired} />);

    expect(
      screen.getByLabelText("Signature status: Unsigned, no signature required")
    ).toBeInTheDocument();
    expect(screen.getByText("Unsigned")).toBeInTheDocument();
  });
});

describe("signature dialog validation", () => {
  it("requires a typed signature value", () => {
    expect(validateSignatureForm("")).toBe("Type your full name to sign.");
  });

  it("returns null for a non-empty signature value", () => {
    expect(validateSignatureForm("Ada Lovelace")).toBeNull();
  });
});

describe("signature request validation", () => {
  it("requires at least one selected signer", () => {
    expect(validateSelectedSigners([])).toBe("Select at least one signer.");
  });

  it("rejects signers without an email", () => {
    expect(
      validateSelectedSigners([{ id: 1, name: "Ada Lovelace", email: "" }])
    ).toBe("Selected employee is missing an email address.");
  });

  it("accepts valid selected signers", () => {
    expect(
      validateSelectedSigners([
        { id: 1, name: "Ada Lovelace", email: "ada@example.com" },
      ])
    ).toBeNull();
  });
});
