export function SkillGaps({ data }: any) {
    return (
      <div className="space-y-4">
        {data.skill_gaps?.map((gap: any, i: number) => (
          <div key={i} className="card">
            <h3 className="card-title">{gap.skill}</h3>
            <p className="text-muted">{gap.domain}</p>
  
            <div className="progress-bar mt-2">
              <div className="progress-fill progress-blue w-65" />
            </div>
          </div>
        ))}
      </div>
    );
  }