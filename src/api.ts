import type { SessionsResponse } from "./types";
import { generateMockSessions } from "./mocks/mockSessions";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://example.com";
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchSessions(days: number): Promise<SessionsResponse> {
  if (USE_MOCK) {
    await delay(400);
    const sessions = generateMockSessions(days);
    return { sessions };
  }

  const res = await fetch(`${API_BASE_URL}/api/sessions?days=${days}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as SessionsResponse;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
