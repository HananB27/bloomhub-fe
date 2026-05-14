import { render, screen } from "@testing-library/react";
import AssetPage from "@/app/assets/[id]/page";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/hr-dashboard/App", () => ({
  default: ({
    initialActiveModule,
    initialAssetId,
  }: {
    initialActiveModule?: string;
    initialAssetId?: string;
  }) => (
    <div data-testid="asset-route">
      {initialActiveModule}:{initialAssetId}
    </div>
  ),
}));

describe("AssetPage", () => {
  it("routes /assets/{id} into the assets module with the asset id", async () => {
    render(await AssetPage({ params: Promise.resolve({ id: "42" }) }));

    expect(screen.getByTestId("asset-route")).toHaveTextContent("assets:42");
  });
});
