import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/types.js";
import {
	AppError,
	getErrorMessage,
	toPublicErrorBody,
} from "../utils/apiError.js";
import logger from "../utils/logger.js";

/**
 * Middleware to handle errors centrally
 */
export const errorHandler: ErrorRequestHandler = (
	err: Error | ApiError | AppError,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	// Log the error using the centralized logger
	// Include the complete error object to have stack trace and details
	logger.error({ err }, "Unhandled error intercepted by errorHandler");

	const message = getErrorMessage(err);
	const name =
		err !== null && typeof err === "object"
			? (err as { name?: unknown }).name
			: undefined;

	// If it's a custom AppError, use its status code and details
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			success: false,
			error: toPublicErrorBody(err),
		});
		return;
	}

	// Categorize common errors
	// Validation errors
	if (
		message?.includes("Validation error") ||
		message?.includes("validation failed")
	) {
		res.status(400).json({
			success: false,
			error: {
				message: "Invalid input data",
				details: process.env.NODE_ENV === "development" ? message : undefined,
			},
		});
		return;
	}

	// Multer errors (file upload)
	if (message?.includes("Only images are allowed") || name === "MulterError") {
		const isDevelopment = process.env.NODE_ENV === "development";
		res.status(400).json({
			success: false,
			error: {
				message: isDevelopment
					? (message ?? "File upload error")
					: "File upload error",
				details: isDevelopment && err instanceof Error ? err.stack : undefined,
			},
		});
		return;
	}

	// Generic error (500 - Internal Server Error)
	res.status(500).json({
		success: false,
		error: toPublicErrorBody(err, "Internal server error"),
	});
};
