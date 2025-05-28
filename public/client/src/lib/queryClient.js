"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryClient = exports.getQueryFn = void 0;
exports.apiRequest = apiRequest;
const react_query_1 = require("@tanstack/react-query");
async function throwIfResNotOk(res) {
    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}
async function apiRequest(method, url, data) {
    const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
    });
    await throwIfResNotOk(res);
    return res;
}
const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
    const res = await fetch(queryKey[0], {
        credentials: "include",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
};
exports.getQueryFn = getQueryFn;
exports.queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            queryFn: (0, exports.getQueryFn)({ on401: "throw" }),
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
