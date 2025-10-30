/**
 * Error handling for AgentFlow API
 * Provides structured error types for all HTTP status codes
 */

// Error response structure from API
export interface ErrorDetail {
    loc?: string[];
    msg?: string;
    type?: string;
}

export interface ApiErrorResponse {
    metadata: {
        message: string;
        request_id: string;
        timestamp: string;
    };
    error: {
        code: string;
        message: string;
        details: ErrorDetail[];
    };
}

/**
 * Base error class for all AgentFlow API errors
 */
export class AgentFlowError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;
    public readonly requestId: string;
    public readonly timestamp: string;
    public readonly details: ErrorDetail[];

    constructor(
        message: string,
        statusCode: number,
        errorCode: string,
        requestId: string,
        timestamp: string,
        details: ErrorDetail[] = []
    ) {
        super(message);
        this.name = 'AgentFlowError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.requestId = requestId;
        this.timestamp = timestamp;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * 400 Bad Request Error
 * Thrown when the request is malformed or contains invalid data
 */
export class BadRequestError extends AgentFlowError {
    constructor(
        message: string,
        requestId: string,
        timestamp: string,
        details: ErrorDetail[] = []
    ) {
        super(message, 400, 'BAD_REQUEST', requestId, timestamp, details);
        this.name = 'BadRequestError';
    }
}

/**
 * 401 Unauthorized Error
 * Thrown when authentication credentials are missing or invalid
 */
export class AuthenticationError extends AgentFlowError {
    constructor(
        message: string,
        requestId: string,
        timestamp: string,
        details: ErrorDetail[] = []
    ) {
        super(message, 401, 'AUTHENTICATION_FAILED', requestId, timestamp, details);
        this.name = 'AuthenticationError';
    }
}

/**
 * 403 Forbidden Error
 * Thrown when the user doesn't have permission to access the resource
 */
export class PermissionError extends AgentFlowError {
    constructor(
        message: string,
        requestId: string,
        timestamp: string,
        details: ErrorDetail[] = []
    ) {
        super(message, 403, 'PERMISSION_ERROR', requestId, timestamp, details);
        this.name = 'PermissionError';
    }
}

/**
 * 404 Not Found Error
 * Thrown when the requested resource doesn't exist
 */
export class NotFoundError extends AgentFlowError {
    constructor(
        message: string,
        requestId: string,
        timestamp: string,
        details: ErrorDetail[] = []
    ) {
        super(message, 404, 'RESOURCE_NOT_FOUND', requestId, timestamp, details);
        this.name = 'NotFoundError';
    }
}

/**
 * 422 Validation Error
 * Thrown when the request data fails validation
 */
export class ValidationError extends AgentFlowError {
    constructor(
        message: string,
        requestId: string,
        timestamp: string,
        details: ErrorDetail[] = []
    ) {
        super(message, 422, 'VALIDATION_ERROR', requestId, timestamp, details);
        this.name = 'ValidationError';
    }
}

/**
 * 500 Server Error
 * Thrown when the server encounters an internal error
 */
export class ServerError extends AgentFlowError {
    constructor(
        message: string,
        requestId: string,
        timestamp: string,
        errorCode: string = 'INTERNAL_SERVER_ERROR',
        details: ErrorDetail[] = [],
        statusCode: number = 500
    ) {
        super(message, statusCode, errorCode, requestId, timestamp, details);
        this.name = 'ServerError';
    }
}

/**
 * Parse error response from API
 */
export async function parseErrorResponse(response: Response): Promise<ApiErrorResponse | null> {
    try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json() as ApiErrorResponse;
        }
        return null;
    } catch (error) {
        // If we can't parse the error response, return null
        return null;
    }
}

/**
 * Create appropriate error instance based on HTTP status code
 */
export async function createErrorFromResponse(
    response: Response,
    fallbackMessage?: string
): Promise<AgentFlowError> {
    const errorData = await parseErrorResponse(response);
    
    // If we successfully parsed the error response
    if (errorData) {
        const { metadata, error } = errorData;
        const message = error.message || fallbackMessage || `HTTP error ${response.status}`;
        const requestId = metadata.request_id || 'unknown';
        const timestamp = metadata.timestamp || new Date().toISOString();
        const details = error.details || [];

        switch (response.status) {
            case 400:
                return new BadRequestError(message, requestId, timestamp, details);
            case 401:
                return new AuthenticationError(message, requestId, timestamp, details);
            case 403:
                return new PermissionError(message, requestId, timestamp, details);
            case 404:
                return new NotFoundError(message, requestId, timestamp, details);
            case 422:
                return new ValidationError(message, requestId, timestamp, details);
            case 500:
            case 502:
            case 503:
            case 504:
                return new ServerError(
                    message,
                    requestId,
                    timestamp,
                    error.code || 'INTERNAL_SERVER_ERROR',
                    details,
                    response.status
                );
            default:
                return new AgentFlowError(
                    message,
                    response.status,
                    error.code || 'UNKNOWN_ERROR',
                    requestId,
                    timestamp,
                    details
                );
        }
    }

    // Fallback if we couldn't parse the error response
    const message = fallbackMessage || `HTTP error! status: ${response.status}`;
    const timestamp = new Date().toISOString();
    
    switch (response.status) {
        case 400:
            return new BadRequestError(message, 'unknown', timestamp);
        case 401:
            return new AuthenticationError(message, 'unknown', timestamp);
        case 403:
            return new PermissionError(message, 'unknown', timestamp);
        case 404:
            return new NotFoundError(message, 'unknown', timestamp);
        case 422:
            return new ValidationError(message, 'unknown', timestamp);
        case 500:
        case 502:
        case 503:
        case 504:
            return new ServerError(message, 'unknown', timestamp, 'INTERNAL_SERVER_ERROR', [], response.status);
        default:
            return new AgentFlowError(
                message,
                response.status,
                'UNKNOWN_ERROR',
                'unknown',
                timestamp
            );
    }
}
