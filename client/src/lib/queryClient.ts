import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCurrentUserId } from "@/hooks/useAuth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      // Auto-logout on 401
      localStorage.removeItem('user');
      window.location.href = '/auth';
      throw new Error("Session expired. Redirecting to login...");
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(): Record<string, string> {
  const userId = getCurrentUserId();
  return userId ? { "X-User-Id": userId } : {};
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const controller = new AbortController();
      const timeoutMs = 8000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let res: Response;
      try {
        res = await fetch(queryKey.join("/") as string, {
          credentials: "include",
          signal: controller.signal,
          headers: getAuthHeaders(),
        });
      } catch (err: any) {
        console.warn("getQueryFn - fetch error or timeout:", err?.name || err);
        clearTimeout(timeout);
        if (unauthorizedBehavior === "returnNull") return null as any;
        throw err;
      }

      clearTimeout(timeout);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
