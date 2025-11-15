export interface ChargingSession {
  id: string;
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
  sohStart: number; // e.g. 94.3 (%)
  sohEnd: number; // e.g. 94.1 (%)
  socStart?: number; // %
  socEnd?: number; // %
  energyAddedKWh?: number;
  avgTempC?: number;
  locationName?: string;
}

export interface SessionsResponse {
  sessions: ChargingSession[];
}
