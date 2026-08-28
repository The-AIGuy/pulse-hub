export function getBackendUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined" && window.location.hostname.includes("-3000.")) {
    return `${window.location.protocol}//${window.location.hostname.replace("-3000.", "-5000.")}`;
  }

  return "http://localhost:5000";
}
