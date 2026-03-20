export function Market({ data }: any) {
    return (
      <div className="space-y-4">
  
        <div className="card">
          <h3 className="card-title">ATS Score</h3>
          <p className="text-3xl font-bold mt-2">{data.ats_score}%</p>
        </div>
  
        <div className="card">
          <h3 className="card-title mb-3">Missing Keywords</h3>
  
          <div className="flex flex-wrap gap-2">
            {data.missing_keywords.map((kw: string, i: number) => (
              <span key={i} className="badge badge-red">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }