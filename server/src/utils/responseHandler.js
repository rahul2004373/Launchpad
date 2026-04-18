export const sendResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        statusCode,
        message,
        data
    });
};
