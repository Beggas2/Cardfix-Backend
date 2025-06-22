"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.createSuccessResponse = exports.createResponse = void 0;
const createResponse = (success, data, message, error) => {
    return {
        success,
        data,
        message,
        error,
    };
};
exports.createResponse = createResponse;
const createSuccessResponse = (data, message) => {
    return (0, exports.createResponse)(true, data, message);
};
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (error, message) => {
    return (0, exports.createResponse)(false, undefined, message, error);
};
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=response.js.map