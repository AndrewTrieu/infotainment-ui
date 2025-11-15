import React, { useEffect, useMemo, useState } from "react";
import type { ChargingSession } from "./types";
import { fetchSessions } from "./api";

type LoadState = "idle" | "loading" | "success" | "error";

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab] = useState<"home" | "battery" | "trips" | "settings">(
    "battery"
  );

  useEffect(() => {
    const load = async () => {
      setLoadState("loading");
      setErrorMessage(null);

      try {
        const { sessions } = await fetchSessions(30);
        const sorted = [...sessions].sort(
          (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()
        );
        setSessions(sorted);
        setLoadState("success");
      } catch (err) {
        console.error(err);
        setErrorMessage("Could not load charging data.");
        setLoadState("error");
      }
    };

    load();
  }, []);

  const latestSession = sessions[0] ?? null;
  const previousSession = sessions[1] ?? null;

  const sohChange = useMemo(() => {
    if (!latestSession || !previousSession) return null;
    return latestSession.sohEnd - previousSession.sohEnd;
  }, [latestSession, previousSession]);

  const sohTrendPoints = useMemo(() => {
    return sessions
      .slice()
      .reverse()
      .map((s) => ({
        label: new Date(s.endedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value: (s.sohStart + s.sohEnd) / 2,
      }));
  }, [sessions]);

  const now = new Date();

  return (
    <div className="screen">
      {/* STATUS BAR – topmost, like Android Auto / CarPlay */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-time">
            {now.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="status-temp">-2°C</span>
        </div>
        <div className="status-center">
          <span className="status-car">
            🚗
            <span className="status-car-range">320 km</span>
          </span>
        </div>
        <div className="status-right">
          <span className="status-icon">📶</span>
          <span className="status-icon">LTE</span>
          <span className="status-icon">🔊</span>
        </div>
      </div>

      {/* APP HEADER */}
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="brand">Battery Health</span>
          <span className="subtitle">Last 30 days</span>
        </div>
        <div className="top-bar-right">
          <span className="status-dot" />
          <span className="status-label">
            {loadState === "loading"
              ? "Syncing…"
              : loadState === "error"
              ? "Offline"
              : "Connected"}
          </span>
        </div>
      </header>

      {/* QUICK CONTROL STRIP – static toggles to feel “car-like” */}
      <div className="quick-strip">
        <button className="quick-btn quick-btn-active">
          <span className="quick-icon">❄️</span>
          <span className="quick-label">AC Auto</span>
        </button>
        <button className="quick-btn">
          <span className="quick-icon">🔥</span>
          <span className="quick-label">Seat</span>
        </button>
        <button className="quick-btn">
          <span className="quick-icon">🌙</span>
          <span className="quick-label">Night</span>
        </button>
        <button className="quick-btn">
          <span className="quick-icon">⚡</span>
          <span className="quick-label">Eco</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      {loadState === "loading" && (
        <div className="center-message">Loading charging history…</div>
      )}

      {loadState === "error" && (
        <div className="center-message error">
          {errorMessage ?? "Something went wrong."}
        </div>
      )}

      {loadState === "success" && sessions.length === 0 && (
        <div className="center-message">
          No charging sessions found for the last 30 days.
        </div>
      )}

      {loadState === "success" && sessions.length > 0 && (
        <main className="content">
          {/* Top section: current SoH + change */}
          <section className="panel panel-main">
            <div className="panel-header">
              <h2>Current battery health (SoH)</h2>
              <span className="panel-subtitle">
                Based on last completed charging session
              </span>
            </div>

            <div className="current-soh-row">
              <div className="current-soh-value">
                <span className="label">SoH now</span>
                <span className="value">
                  {latestSession ? latestSession.sohEnd.toFixed(1) : "--"}%
                </span>
                <span className="secondary">
                  Session ended{" "}
                  {new Date(latestSession!.endedAt).toLocaleString(undefined, {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="soh-change">
                <span className="label">Change since last session</span>
                {sohChange !== null ? (
                  <span
                    className={
                      "delta-tag " +
                      (sohChange > 0
                        ? "delta-up"
                        : sohChange < 0
                        ? "delta-down"
                        : "delta-flat")
                    }
                  >
                    {sohChange > 0 ? "+" : ""}
                    {sohChange.toFixed(2)} %
                  </span>
                ) : (
                  <span className="secondary">Not enough history yet</span>
                )}
                {sohChange !== null && (
                  <span className="secondary">
                    {sohChange > 0
                      ? "Slightly improved compared to previous session."
                      : sohChange < 0
                      ? "Slightly decreased. Frequent fast-charging and heat may affect this."
                      : "No visible change compared to previous session."}
                  </span>
                )}
              </div>
            </div>

            <div className="summary-row">
              {typeof latestSession?.energyAddedKWh === "number" && (
                <div className="summary-item">
                  <span className="label">Energy added</span>
                  <span className="value">
                    {latestSession.energyAddedKWh.toFixed(1)} kWh
                  </span>
                </div>
              )}

              {typeof latestSession?.avgTempC === "number" && (
                <div className="summary-item">
                  <span className="label">Avg. pack temperature</span>
                  <span className="value">
                    {latestSession.avgTempC.toFixed(1)} °C
                  </span>
                </div>
              )}

              {typeof latestSession?.socStart === "number" &&
                typeof latestSession?.socEnd === "number" && (
                  <div className="summary-item">
                    <span className="label">SoC change</span>
                    <span className="value">
                      {latestSession.socStart}% → {latestSession.socEnd}%
                    </span>
                  </div>
                )}
            </div>
          </section>

          {/* Middle section: SoH trend */}
          <section className="panel panel-chart">
            <div className="panel-header">
              <h2>SoH trend (last 30 days)</h2>
              <span className="panel-subtitle">
                Each point is one charging session
              </span>
            </div>

            <SimpleTrendChart points={sohTrendPoints} />
          </section>

          {/* Bottom section: session list */}
          <section className="panel panel-list">
            <div className="panel-header">
              <h2>Charging sessions</h2>
              <span className="panel-subtitle">
                {sessions.length} session
                {sessions.length !== 1 ? "s" : ""} in the last 30 days
              </span>
            </div>

            <div className="session-list">
              {sessions.map((session, index) => {
                const prev = sessions[index + 1];
                const delta =
                  prev != null
                    ? session.sohEnd - prev.sohEnd
                    : undefined;

                return (
                  <SessionRow
                    key={session.id}
                    session={session}
                    sohDelta={delta}
                  />
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* BOTTOM NAV – static icons / labels */}
      <nav className="bottom-nav">
        <button
          className={
            "nav-button " + (activeTab === "home" ? "nav-button-active" : "")
          }
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={
            "nav-button " + (activeTab === "battery" ? "nav-button-active" : "")
          }
        >
          <span className="nav-icon">🔋</span>
          <span className="nav-label">Battery</span>
        </button>
        <button
          className={
            "nav-button " + (activeTab === "trips" ? "nav-button-active" : "")
          }
        >
          <span className="nav-icon">🗺️</span>
          <span className="nav-label">Trips</span>
        </button>
        <button
          className={
            "nav-button " +
            (activeTab === "settings" ? "nav-button-active" : "")
          }
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </nav>
    </div>
  );
};

interface TrendPoint {
  label: string;
  value: number;
}

interface SimpleTrendChartProps {
  points: TrendPoint[];
}

const SimpleTrendChart: React.FC<SimpleTrendChartProps> = ({ points }) => {
  if (points.length === 0) {
    return <div className="chart-placeholder">No data yet.</div>;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = 4;

  const norm = (v: number) => {
    if (max === min) return 50;
    return (
      padding +
      ((max - v) / (max - min)) * (100 - padding * 2)
    );
  };

  const stepX = points.length > 1 ? 100 / (points.length - 1) : 50;

  const pathD = points
    .map((p, i) => {
      const x = i * stepX;
      const y = norm(p.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="chart-wrapper">
      <svg viewBox="0 0 100 100" className="chart-svg" preserveAspectRatio="none">
        <path d={pathD} className="chart-line" fill="none" />
        {points.map((p, i) => {
          const x = i * stepX;
          const y = norm(p.value);
          return (
            <circle
              key={p.label + i}
              cx={x}
              cy={y}
              r={1.2}
              className="chart-dot"
            />
          );
        })}
      </svg>
      <div className="chart-labels">
        {points.map((p, i) => (
          <span key={p.label + i} className="chart-label">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
};

interface SessionRowProps {
  session: ChargingSession;
  sohDelta?: number;
}

const SessionRow: React.FC<SessionRowProps> = ({ session, sohDelta }) => {
  const end = new Date(session.endedAt);

  return (
    <div className="session-row">
      <div className="session-main">
        <div className="session-title">
          {end.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          ·{" "}
          {end.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div className="session-subtitle">
          {session.locationName ?? "Unknown location"}
        </div>
      </div>

      <div className="session-metrics">
        <div className="session-metric">
          <span className="label">SoH</span>
          <span className="value">{session.sohEnd.toFixed(1)}%</span>
        </div>

        {typeof sohDelta === "number" && (
          <div className="session-metric">
            <span className="label">Δ vs prev</span>
            <span
              className={
                "delta-tag small " +
                (sohDelta > 0
                  ? "delta-up"
                  : sohDelta < 0
                  ? "delta-down"
                  : "delta-flat")
              }
            >
              {sohDelta > 0 ? "+" : ""}
              {sohDelta.toFixed(2)}%
            </span>
          </div>
        )}

        {typeof session.energyAddedKWh === "number" && (
          <div className="session-metric">
            <span className="label">Energy</span>
            <span className="value">
              {session.energyAddedKWh.toFixed(1)} kWh
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
