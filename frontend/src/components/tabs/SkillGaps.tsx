import type { Analysis } from "../../pages/Dashboard";

interface Props { data: Analysis; }

const domainMeta: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  Cloud:    { color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)",  icon: "☁️" },
  DevOps:   { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)", icon: "⚙️" },
  Architecture: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.25)", icon: "🏗️" },
  Backend:  { color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)",  icon: "🔧" },
  Frontend: { color: "#f472b6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.25)", icon: "🎨" },
  default:  { color: "#22d3ee", bg: "rgba(34,211,238,0.1)",  border: "rgba(34,211,238,0.25)",  icon: "📌" },
};

function getDomainMeta(domain: string) {
  return domainMeta[domain] ?? domainMeta.default;
}

export function SkillGaps({ data }: Props) {
  const gaps = data.skill_gaps ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#f59e0b" }}>⚠</span> Skill Gaps
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
          {gaps.length} gaps identified — close these to unlock better roles and higher match scores.
        </p>
      </div>

      {/* Gap cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
        {gaps.map((gap, i) => {
          const meta = getDomainMeta(gap.domain);
          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${meta.border}`,
                borderRadius: "12px",
                padding: "16px",
                transition: "all 0.2s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = meta.bg;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              {/* Glow accent top-right */}
              <div style={{
                position: "absolute", top: "-20px", right: "-20px",
                width: "80px", height: "80px", borderRadius: "50%",
                background: meta.bg, filter: "blur(20px)", pointerEvents: "none",
              }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>
                    {gap.skill}
                  </div>
                  <span style={{
                    fontSize: "0.7rem", padding: "2px 8px", borderRadius: "20px", fontWeight: 500,
                    background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                  }}>
                    {meta.icon} {gap.domain}
                  </span>
                </div>
                <span style={{ fontSize: "1.5rem", opacity: 0.6 }}>{meta.icon}</span>
              </div>

              {/* Urgency bar */}
              <div style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#475569", marginBottom: "5px" }}>
                  <span>Market demand</span>
                  <span style={{ color: meta.color }}>High</span>
                </div>
                <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${70 + (i % 3) * 10}%`,
                    background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
                    borderRadius: "2px",
                    animation: "growBar 1s ease forwards",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ATS Impact */}
      <div style={{
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: "1.5rem" }}>💡</span>
        <div>
          <div style={{ fontWeight: 600, color: "#fbbf24", marginBottom: "4px", fontSize: "0.9rem" }}>
            ATS Impact
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6 }}>
            Adding these skills to your resume and LinkedIn can improve your ATS pass rate by up to 30%.
            Prioritise <strong style={{ color: "#f1f5f9" }}>{gaps[0]?.skill}</strong> — it's the highest-demand gap in your profile.
          </p>
        </div>
      </div>
    </div>
  );
}