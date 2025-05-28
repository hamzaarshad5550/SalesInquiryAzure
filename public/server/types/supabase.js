export function isSuccessResponse(response) {
    return response.error === null && response.data !== null;
}
export function isErrorResponse(response) {
    return response.error !== null;
}
export function isArrayResponse(response) {
    return Array.isArray(response.data);
}
export function getResponseData(response) {
    if (isErrorResponse(response)) {
        throw response.error;
    }
    if (!isSuccessResponse(response)) {
        return null;
    }
    return response.data;
}
