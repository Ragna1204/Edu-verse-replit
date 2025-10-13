import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
    // Use an AbortController to avoid hanging requests. Default timeout: 8000ms
    const controller = new AbortController();
    const timeoutMs = 8000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        signal: controller.signal,
      });
    } catch (err: any) {
      // If the request was aborted or network failed, treat as unauthenticated when requested
      console.warn("getQueryFn - fetch error or timeout:", err?.name || err);
      clearTimeout(timeout);
      if (unauthorizedBehavior === "returnNull") return null as any;
      throw err;
    }

    clearTimeout(timeout);

    console.log("getQueryFn - res.status:", res.status);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log("getQueryFn - returning null for 401");
      return null;
    }

    console.log("getQueryFn - calling throwIfResNotOk");
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
