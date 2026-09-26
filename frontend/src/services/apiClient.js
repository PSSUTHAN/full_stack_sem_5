/**
 * Authenticated API request helper for Engineers Veedu.
 * Automatically injects the stored JWT token into request headers.
 */

export const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...extraHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const authFetch = (url, options = {}) => {
    const headers = getAuthHeaders(options.headers || {});
    return fetch(url, {
        ...options,
        headers,
    });
};
