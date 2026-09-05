const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function checkBackendWake(
  onWakingStateChange: (isWaking: boolean) => void
): () => void {
  // Only activate health wake-up probe in PROD build (Render cold-start handling)
  if (!import.meta.env.PROD) {
    return () => {};
  }

  let isResolved = false;
  const controller = new AbortController();

  // Timer: if health check hasn't responded within 3 seconds, show waking banner
  const wakeTimer = setTimeout(() => {
    if (!isResolved) {
      onWakingStateChange(true);
    }
  }, 3000);

  // Health check request
  fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal })
    .then((res) => {
      isResolved = true;
      clearTimeout(wakeTimer);
      if (res.ok) {
        onWakingStateChange(false);
      }
    })
    .catch(() => {
      // Ignore abort errors or temporary connection retries
    });

  return () => {
    isResolved = true;
    clearTimeout(wakeTimer);
    controller.abort();
  };
}
