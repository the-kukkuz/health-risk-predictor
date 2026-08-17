import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PredictionPage from "../pages/PredictionPage";
import { renderWithRouter } from "../test/setup";

// Mock the API module so tests do not make network calls.
vi.mock("../services/api", () => ({
  predict: vi.fn(),
  NotReadyError: class NotReadyError extends Error {
    detail: any;
    constructor(detail: any) {
      super(detail.message);
      this.detail = detail;
    }
  },
}));

import { predict, NotReadyError } from "../services/api";

beforeEach(() => {
  vi.mocked(predict).mockReset();
});

describe("Diabetes prediction page", () => {
  it("renders the diabetes form with all 8 fields", () => {
    renderWithRouter(<PredictionPage />, "/predict/diabetes");
    expect(screen.getByLabelText(/Glucose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blood Pressure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Predict Risk/i })).toBeInTheDocument();
  });

  it("submits and renders the prediction response", async () => {
    vi.mocked(predict).mockResolvedValue({
      disease: "diabetes",
      prediction: 1,
      probability: 0.79,
      risk_band: "High",
      threshold: 0.3,
      top_factors: [
        { feature: "Glucose", impact: 0.31, direction: "increases_risk", shap_value: 0.31 },
      ],
      model_version: "1.0.0",
      disclaimer: "not a medical diagnostic tool",
    });
    const user = userEvent.setup();
    renderWithRouter(<PredictionPage />, "/predict/diabetes");
    await user.click(screen.getByRole("button", { name: /Predict Risk/i }));

    await waitFor(() => {
      expect(screen.getByText(/High/)).toBeInTheDocument();
    });
    expect(screen.getByText(/79%/)).toBeInTheDocument();
    expect(screen.getByText(/Glucose/)).toBeInTheDocument();
  });

  it("shows a loading state while submitting", async () => {
    let resolve: (v: any) => void = () => {};
    vi.mocked(predict).mockImplementation(
      () => new Promise((res) => (resolve = res))
    );
    const user = userEvent.setup();
    renderWithRouter(<PredictionPage />, "/predict/diabetes");
    await user.click(screen.getByRole("button", { name: /Predict Risk/i }));
    expect(screen.getByText(/Running model/i)).toBeInTheDocument();
    resolve({
      disease: "diabetes",
      prediction: 0,
      probability: 0.1,
      risk_band: "Low",
      threshold: 0.3,
      top_factors: [],
    });
    await waitFor(() => expect(screen.getByText(/10%/)).toBeInTheDocument());
  });

  it("shows an error state on failure", async () => {
    vi.mocked(predict).mockRejectedValue(new Error("Network failure"));
    const user = userEvent.setup();
    renderWithRouter(<PredictionPage />, "/predict/diabetes");
    await user.click(screen.getByRole("button", { name: /Predict Risk/i }));
    await waitFor(() =>
      expect(screen.getByText(/Network failure/)).toBeInTheDocument()
    );
  });
});

describe("Heart placeholder page", () => {
  it("shows the not-ready message and no fake predictions", () => {
    renderWithRouter(<PredictionPage />, "/predict/heart");
    expect(
      screen.getByText(/currently being integrated/i)
    ).toBeInTheDocument();
    // No risk percentages or fake probabilities should appear.
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Predict Risk/i })).not.toBeInTheDocument();
  });

  it("renders the not-ready panel when the API returns 503", async () => {
    vi.mocked(predict).mockRejectedValue(
      new NotReadyError({
        status: "not_ready",
        disease: "heart_disease",
        message: "Heart disease prediction module is not currently available.",
      })
    );
    // Even if fields existed, a 503 must surface the not-ready UI.
    renderWithRouter(<PredictionPage />, "/predict/heart");
    await waitFor(() =>
      expect(
        screen.getByText(/currently being integrated/i)
      ).toBeInTheDocument()
    );
  });
});
