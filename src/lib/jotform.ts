import { type InvestigationApiResponse } from "../types/investigation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export async function fetchInvestigation(): Promise<InvestigationApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/investigation`);

  if (!response.ok) {
    throw new Error(`Investigation API failed with HTTP ${response.status}`);
  }

  return (await response.json()) as InvestigationApiResponse;
}
