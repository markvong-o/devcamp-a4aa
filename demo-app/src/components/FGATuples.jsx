import { useState, useEffect, useRef } from "react";

function shortUser(user) {
  const sub = user.match(/^user:auth0\|(.+)$/);
  if (sub) return `user:${sub[1].slice(0, 10)}…`;
  return user;
}

export function FGATuples() {
  const [data, setData]   = useState({ live: false, tuples: [] });
  const [paused, setPaused] = useState(false);
  const pausedRef            = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const refresh = () => {
      if (pausedRef.current) return;
      fetch("/api/fga/tuples")
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => {});
    };
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  const { live, tuples } = data;

  // Group by user (or department) so it's easy to answer "why can Alice
  // do this but Bob can't" by reading one user's whole tuple set at once.
  const grouped = (tuples || []).reduce((acc, t) => {
    (acc[t.user] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="panel-container">
      <div className="panel-header">
        <span className="panel-title">FGA Tuples</span>
        <div className="log-controls">
          {tuples?.length > 0 && (
            <span className="log-count">{tuples.length} tuples</span>
          )}
          <button
            className={`log-pause-btn ${paused ? "paused" : ""}`}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {live ? (
        <div className="logs-empty">
          <p>This tenant has a live Okta FGA store provisioned.</p>
          <p className="logs-empty-hint">
            Tuples live in Okta FGA, not in this process. Check the FGA dashboard or
            the Check/Read API against your store to inspect them.
          </p>
        </div>
      ) : !tuples || tuples.length === 0 ? (
        <div className="logs-empty">
          <p>No tuples seeded yet.</p>
          <p className="logs-empty-hint">
            Log in as Alice or Bob and make a tool call (search, get, or share a
            document) to seed the simulated authorization graph.
          </p>
        </div>
      ) : (
        <div className="log-entries">
          {Object.entries(grouped).map(([user, userTuples]) => (
            <div key={user} className="log-entry">
              <div className="log-entry-header" style={{ cursor: "default" }}>
                <span className="log-tool-name" title={user}>
                  {shortUser(user)}
                </span>
                <span className="log-count">{userTuples.length}</span>
              </div>
              <div className="log-entry-detail">
                {userTuples.map((t, i) => (
                  <div
                    key={i}
                    className="log-detail-block"
                    style={{ flexDirection: "row", alignItems: "baseline", gap: "8px" }}
                  >
                    <span className="log-user-sub">is</span>
                    <span className="log-tool-name" style={{ flex: "none", color: "#BC6DFF" }}>
                      {t.relation}
                    </span>
                    <span className="log-user-sub">of</span>
                    <span className="log-tool-name" style={{ flex: "none" }}>{t.object}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
