import type { BaseError } from "wagmi";

/**
 * Error code mapping type for i18n keys
 */
export type TransactionErrorCode =
	| "userRejected"
	| "insufficientFunds"
	| "gasEstimationFailed"
	| "nonceTooLow"
	| "replacementUnderpriced"
	| "transactionUnderpriced"
	| "executionReverted"
	| "networkError"
	| "invalidParams"
	| "chainMismatch"
	| "contractError"
	| "genericError";

/**
 * Parses a transaction error and returns the appropriate i18n error code
 * @param error - The error object from wagmi/viem
 * @returns The error code key for i18n translation (common.errors.{code})
 */
export function parseTransactionError(error: unknown): TransactionErrorCode {
	// Handle user rejection (MetaMask cancel, etc.)
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// User rejected transaction (Error 4001)
		if (
			message.includes("user rejected") ||
			message.includes("user denied") ||
			message.includes("user cancelled") ||
			message.includes("rejected by user") ||
			message.includes("action_rejected")
		) {
			return "userRejected";
		}

		// Insufficient funds
		if (
			message.includes("insufficient funds") ||
			message.includes("insufficient balance") ||
			message.includes("exceeds balance")
		) {
			return "insufficientFunds";
		}

		// Gas estimation failed
		if (
			message.includes("gas required exceeds") ||
			message.includes("cannot estimate gas") ||
			message.includes("gas estimation failed") ||
			message.includes("out of gas")
		) {
			return "gasEstimationFailed";
		}

		// Nonce too low
		if (
			message.includes("nonce too low") ||
			message.includes("invalid nonce") ||
			message.includes("nonce has already been used")
		) {
			return "nonceTooLow";
		}

		// Replacement transaction underpriced
		if (
			message.includes("replacement transaction underpriced") ||
			message.includes("replacement fee too low")
		) {
			return "replacementUnderpriced";
		}

		// Transaction underpriced
		if (
			message.includes("transaction underpriced") ||
			message.includes("max fee per gas less than block base fee") ||
			message.includes("fee too low")
		) {
			return "transactionUnderpriced";
		}

		// Execution reverted
		if (
			message.includes("execution reverted") ||
			message.includes("revert") ||
			message.includes("transaction failed")
		) {
			return "executionReverted";
		}

		// Network errors
		if (
			message.includes("network error") ||
			message.includes("network request failed") ||
			message.includes("connection refused") ||
			message.includes("timeout")
		) {
			return "networkError";
		}

		// Invalid parameters
		if (
			message.includes("invalid argument") ||
			message.includes("invalid parameters") ||
			message.includes("missing required parameter")
		) {
			return "invalidParams";
		}

		// Wrong chain / chain mismatch
		if (
			message.includes("wrong chain") ||
			message.includes("chain mismatch") ||
			message.includes("unsupported chain") ||
			message.includes("switch chain")
		) {
			return "chainMismatch";
		}

		// Contract-specific errors
		if (
			message.includes("contract") &&
			(message.includes("error") || message.includes("failed"))
		) {
			return "contractError";
		}
	}

	// Check for BaseError from wagmi/viem
	if (error && typeof error === "object" && "shortMessage" in error) {
		const baseError = error as BaseError;
		const shortMessage = baseError.shortMessage?.toLowerCase() || "";

		if (shortMessage.includes("user rejected")) return "userRejected";
		if (shortMessage.includes("insufficient funds")) return "insufficientFunds";
		if (shortMessage.includes("gas")) return "gasEstimationFailed";
		if (shortMessage.includes("reverted")) return "executionReverted";
	}

	// Default to generic error
	return "genericError";
}

/**
 * Returns the full i18n key path for a transaction error
 * @param error - The error object
 * @returns The full i18n key path (e.g., "common.errors.userRejected")
 */
export function getTransactionErrorI18nKey(error: unknown): string {
	const errorCode = parseTransactionError(error);
	return `common.errors.${errorCode}`;
}
