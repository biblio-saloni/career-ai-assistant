export const getWidthClass = (value: number): string => {
    if (value >= 90) return "w-90";
    if (value >= 85) return "w-85";
    if (value >= 80) return "w-80";
    if (value >= 75) return "w-75";
    if (value >= 70) return "w-70";
    if (value >= 65) return "w-65";
    return "w-60";
  };
  
  export const getColorClass = (value: number): string => {
    if (value >= 80) return "progress-green";
    if (value >= 65) return "progress-yellow";
    return "progress-red";
  };