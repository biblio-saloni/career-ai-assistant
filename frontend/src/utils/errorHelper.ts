/**
 * Translates technical error messages into user-friendly language.
 */
export function humanizeError(error: string | Error): string {
  const msg = typeof error === "string" ? error : error.message;

  // Rate limits (Groq, JSearch, etc)
  if (msg.includes("429") || msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("rate_limit_exceeded")) {
    const timeMatch = msg.match(/try again in ([0-9hms\.]+)/i);
    if (timeMatch && timeMatch[1]) {
      // Clean up the time (e.g. "1h8m3.264s" -> "1h 8m 3s")
      const cleanTime = timeMatch[1].replace(/\.\d+/g, '').replace(/([hms])/g, '$1 ').trim();
      return `The AI has reached its limit. Please try again in ${cleanTime}.`;
    }
    return "The AI is currently receiving a high volume of requests. Please wait a moment and try again.";
  }

  // Auth / API Keys
  if (msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("forbidden")) {
    return "Service authentication error. Please ensure your API keys are correctly configured in the environment.";
  }

  // Network / Connection
  if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network error") || msg.toLowerCase().includes("load failed")) {
    return "Connection error. Please check your internet and make sure the backend server is running.";
  }

  // Backend / 500
  if (msg.includes("500") || msg.toLowerCase().includes("internal server error")) {
    // Check if it's a specific backend error we know
    if (msg.toLowerCase().includes("analysis")) {
      return "Something went wrong during resume analysis. This is usually temporary — please try again in a moment.";
    }
    return "The server encountered an unexpected issue. Please try again later.";
  }

  // Parsing / Format errors
  if (msg.toLowerCase().includes("parsing failed") || msg.toLowerCase().includes("unexpected token")) {
    return "We had trouble processing the AI response. A simple refresh usually fixes this!";
  }

  // Default fallback
  return msg || "An unexpected error occurred. Please try refreshing the page.";
}
