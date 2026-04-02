export function getErrorMessage(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : fallback;
  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosErr = err as { response?: { data?: { error?: string } } };
    return axiosErr.response?.data?.error ?? msg;
  }
  return msg;
}
