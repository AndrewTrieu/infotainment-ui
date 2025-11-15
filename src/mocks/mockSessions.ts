import type { ChargingSession } from "../types";

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

const LOCATIONS = [
  "ABC Lataus, Lahti",
  "K-Lataus, Espoo",
  "Neste, Vantaa",
  "Kempower Demo Site, Lahti",
  "Helen Lataus, Helsinki",
];

export function generateMockSessions(days = 30): ChargingSession[] {
  const sessions: ChargingSession[] = [];

  const now = new Date();
  let currentSoh = 95.0;
  const MIN_SOH = 80.0;

  for (let offset = days - 1; offset >= 0; offset--) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - offset);

    const hasSession = Math.random() < 0.6;
    if (!hasSession) continue;

    const chargeMinutes = Math.floor(randomBetween(20, 90));

    const startHour = randomBetween(7, 21);
    const startedAt = new Date(dayDate);
    startedAt.setHours(startHour, randomBetween(0, 59), 0, 0);

    const endedAt = new Date(startedAt);
    endedAt.setMinutes(endedAt.getMinutes() + chargeMinutes);

    const socStart = Math.round(randomBetween(10, 40));
    const socEnd = Math.round(randomBetween(80, 100));
    const energyAddedKWh = +randomBetween(15, 60).toFixed(1);
    const avgTempC = +randomBetween(-5, 30).toFixed(1);

    const sohStart = currentSoh;
    const delta = randomBetween(-0.08, -0.01);
    currentSoh = Math.max(MIN_SOH, +(currentSoh + delta).toFixed(2));
    const sohEnd = currentSoh;

    const locationName =
      LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    sessions.push({
      id: `mock-${offset}`,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      sohStart,
      sohEnd,
      socStart,
      socEnd,
      energyAddedKWh,
      avgTempC,
      locationName,
    });
  }

  return sessions.sort(
    (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()
  );
}
