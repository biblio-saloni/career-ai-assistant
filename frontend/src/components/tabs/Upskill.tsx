import type { Analysis } from "../../pages/Dashboard";

interface Props {
  data: Analysis;
}

export function Upskill({ data }: Props) {
  return (
    <div className="grid-2">

      {/* Skill Gaps */}
      <div className="card">
        <h3 className="card-title">Skill Gaps</h3>

        <div className="upskill-item-list">
          {data.skill_gaps.map((gap, i) => (
            <div key={i} className="upskill-item">
              <p>{gap.skill}</p>
              <p className="text-muted">{gap.domain}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Improvements */}
      <div className="card">
        <h3 className="card-title">Resume Improvements</h3>

        <ul className="list upskill-list">
          {data.improvements.map((imp, i) => (
            <li key={i}>{imp}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}