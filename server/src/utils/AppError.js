/**
 * Custom Error extending native Error class to attach status codes
 * (Note: Custom Errors natively must remain classes extending Error in JS)
 */
export default class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
