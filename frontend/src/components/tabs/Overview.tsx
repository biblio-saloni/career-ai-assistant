import type { Analysis } from "../../pages/Dashboard";

interface Props {
  data: Analysis;
}

export function Overview({ data }: Props) {
  return (
    <div className="grid-3">

      {/* Top Cards */}
      <div className="card">
        <p className="card-title">{data.skills.length}</p>
        <p className="text-muted">Skills</p>
      </div>

      <div className="card">
        <p className="card-title">{data.recommended_roles.length}</p>
        <p className="text-muted">Roles</p>
      </div>

      <div className="card">
        <p className="card-title">{data.experience_level}</p>
        <p className="text-muted">Experience</p>
      </div>

      {/* Skills Section */}
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3 className="card-title">Skills</h3>

        <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {data.skills.map((skill, i) => (
            <span key={i} className="badge badge-green">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="card">
        <h3 className="card-title">Recommended Roles</h3>

        <div style={{ marginTop: "10px" }}>
          {data.recommended_roles.map((role, i) => (
            <p key={i}>{role}</p>
          ))}
        </div>
      </div>

    </div>
  );
}