import { getWidthClass, getColorClass } from "../../utils/uiHelper";

export function Jobs({ data }: any) {
  return (
    <div className="space-y-4">
      {data.recommended_roles.map((role: string, i: number) => {
        const match = 70 + i * 10;

        return (
          <div key={i} className="card">
            <h3 className="card-title">{role}</h3>

            <div className="progress-bar mt-2">
              <div
                className={`progress-fill ${getColorClass(match)} ${getWidthClass(match)}`}
              />
            </div>

            <p className="text-muted mt-1">{match}% match</p>
          </div>
        );
      })}
    </div>
  );
}