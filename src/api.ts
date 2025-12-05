import type { SessionsResponse, ChargingSession } from "./types";
import { generateMockSessions } from "./mocks/mockSessions";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://example.com";
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === "true";

interface BackendSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  soc_start: number | null;
  soc_end: number | null;
  energy_added_kwh: number | null;
  avg_temp_c: number | null;
  location_name: string | null;
  soh: number | null;
  health_grade: string | null;
}

function normalizeSoc(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  if (value <= 1) {
    return value * 100;
  }
  if (value > 100) {
    return 100;
  }
  return value;
}

function normalizeSoh(value: number | null): number {
  if (value == null) return 0;
  if (value <= 1) {
    return value * 100;
  }
  if (value > 100) {
    return 100;
  }
  return value;
}

function mapBackendSession(raw: BackendSession): ChargingSession {
  return {
    id: raw.id,
    startedAt: raw.started_at,
    endedAt: raw.ended_at ?? raw.started_at,
    sohStart: normalizeSoh(raw.soh),
    sohEnd: normalizeSoh(raw.soh),
    socStart: normalizeSoc(raw.soc_start),
    socEnd: normalizeSoc(raw.soc_end),
    energyAddedKWh: raw.energy_added_kwh ?? undefined,
    avgTempC: raw.avg_temp_c ?? undefined,
    locationName: raw.location_name ?? undefined,
  };
}

export async function fetchSessions(days: number): Promise<SessionsResponse> {
  if (USE_MOCK) {
    await delay(400);
    const sessions = generateMockSessions(days);
    return { sessions };
  }

  const res = await fetch(`${API_BASE_URL}/charge_sessions`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}`);
  }

  const rawSessions = (await res.json()) as BackendSession[];

  const mapped: ChargingSession[] = rawSessions.map(mapBackendSession);

  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const filtered = mapped
    .filter((s) => {
      const end = new Date(s.endedAt);
      return !isNaN(end.getTime()) && end >= cutoff;
    })
    .sort(
      (a, b) => new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime()
    );

  return { sessions: filtered };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
