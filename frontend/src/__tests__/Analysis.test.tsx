import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Analysis from "../pages/Analysis";

// Consolidated Analysis flow: condition select -> data entry -> results.
function renderAnalysis() {
  return render(
    <MemoryRouter>
      <Analysis />
    </MemoryRouter>
  );
}

const mockPredictionResult = {
  disease: "diabetes",
  prediction: 1,
  probability: 0.796,
  risk_band: "High" as const,
  threshold: 0.3,
  top_factors: [
    { feature: "Glucose", impact: 0.233, direction: "increases_risk" as const, shap_value: 0.233 },
    { feature: "BMI", impact: 0.15, direction: "increases_risk" as const, shap_value: 0.15 },
  ],
  model_version: "1.0.0",
  disclaimer: "Test disclaimer",
};

describe("Analysis flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for all API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPredictionResult),
      })
    ) as any;
  });

  it("shows both disease conditions on the select state", () => {
    renderAnalysis();
    expect(screen.getByText("Diabetes Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Heart Disease Risk Assessment")).toBeInTheDocument();
  });

  it("renders a unified data entry form with dropdowns for heart", async () => {
    const user = userEvent.setup();
    renderAnalysis();
    // Select both conditions, then continue.
    await user.click(screen.getByText("Heart Disease Risk Assessment"));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Unified form sections render.
    expect(screen.getAllByText("Demographic").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vitals").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lab Results").length).toBeGreaterThan(0);

    // Heart categorical fields render as dropdowns.
    expect(screen.getByLabelText("Sex")).toBeInTheDocument();
    expect(screen.getByLabelText("Chest Pain Type")).toBeInTheDocument();

    // Single submit button (not per-disease).
    expect(screen.getByRole("button", { name: /analyze risk profile/i })).toBeInTheDocument();
  });

  it("shows results after submitting unified form", async () => {
    const user = userEvent.setup();
    renderAnalysis();
    // Keep default (diabetes only), continue to entry.
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /analyze risk profile/i }));

    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
