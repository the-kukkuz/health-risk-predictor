import type { ModelInfo, NotReadyDetail, PredictionResponse } from "../types";

// All API calls use relative URLs; Vite dev proxy or the deployment reverse
// proxy routes them to the FastAPI backend.
const API_V1 = "/api/v1";

function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export class NotReadyError extends Error {
  detail: NotReadyDetail;
  constructor(detail: NotReadyDetail) {
    super(detail.message);
    this.name = "NotReadyError";
    this.detail = detail;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 503) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body.detail === "object" && body.detail !== null
        ? body.detail
        : body;
    throw new NotReadyError({
      status: "not_ready",
      disease: detail.disease ?? "unknown",
      message:
        detail.message ?? "This module is not currently available.",
    });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      body.detail?.message ||
      (typeof body.detail === "string" ? body.detail : null) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function getHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch("/health");
  return res.json();
}

export async function getModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${API_V1}/models`, {
    headers: getAuthHeaders(),
  });
  return parseResponse<ModelInfo[]>(res);
}

export async function predict(
  disease: string,
  payload: Record<string, number>
): Promise<PredictionResponse> {
  const res = await fetch(`${API_V1}/predict/${disease}`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseResponse<PredictionResponse>(res);
}

export async function getStatistics(disease: string): Promise<any> {
  const res = await fetch(`${API_V1}/statistics/${disease}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse<any>(res);
}

export async function getPredictions(
  disease?: string
): Promise<{ items: any[]; total: number }> {
  const qs = disease ? `?disease=${disease}` : "";
  const res = await fetch(`${API_V1}/predictions${qs}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
}
