import type { SWRConfiguration } from "swr";
import { api, ApiError } from "./api-client";

export const swrConfig: SWRConfiguration = {
  fetcher: (path: string) => api.get(path),
  revalidateOnFocus: false,
  shouldRetryOnError: (err) => {
    // Don't retry on 401/403 — those need user action
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return false;
    return true;
  },
  errorRetryCount: 3,
  dedupingInterval: 5000,
};
