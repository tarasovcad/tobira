import {Ratelimit} from "@upstash/ratelimit";
import {redis} from "@/lib/cache/redis";
import {logger, toLogError} from "@/lib/shared/logger";

const extensionPairingMinuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(5, "1 m", 5),
  prefix: "rl:extension-pairing:create:ip:minute",
});

const extensionPairingHourLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(20, "1 h", 20),
  prefix: "rl:extension-pairing:create:ip:hour",
});

const extensionPairingRedeemMinuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(30, "1 m", 30),
  prefix: "rl:extension-pairing:redeem:ip:minute",
});

const extensionPairingRedeemTokenLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(10, "1 m", 10),
  prefix: "rl:extension-pairing:redeem:token:minute",
});

export class ExtensionPairingRateLimitError extends Error {
  constructor(public readonly reset: number) {
    super("Too many extension pairing requests. Please try again later.");
    this.name = "ExtensionPairingRateLimitError";
  }

  get retryAfterSeconds(): number {
    return Math.max(1, Math.ceil((this.reset - Date.now()) / 1000));
  }
}

export class ExtensionPairingRateLimitUnavailableError extends Error {
  constructor() {
    super("Extension pairing rate limiting is temporarily unavailable");
    this.name = "ExtensionPairingRateLimitUnavailableError";
  }
}

export async function enforceExtensionPairingCreateRateLimit(identifier: string) {
  try {
    await enforceLimit(extensionPairingMinuteLimiter, identifier);
    await enforceLimit(extensionPairingHourLimiter, identifier);
  } catch (error) {
    if (
      error instanceof ExtensionPairingRateLimitError ||
      error instanceof ExtensionPairingRateLimitUnavailableError
    ) {
      throw error;
    }

    logger.error("Extension pairing rate limit failed", {error: toLogError(error)});
    throw new ExtensionPairingRateLimitUnavailableError();
  }
}

export async function enforceExtensionPairingRedeemRateLimit(ip: string, deviceTokenHash: string) {
  try {
    await enforceLimit(extensionPairingRedeemMinuteLimiter, ip);
    // The hash avoids putting the device token itself into the rate-limit key.
    await enforceLimit(extensionPairingRedeemTokenLimiter, deviceTokenHash.slice(0, 16));
  } catch (error) {
    if (
      error instanceof ExtensionPairingRateLimitError ||
      error instanceof ExtensionPairingRateLimitUnavailableError
    ) {
      throw error;
    }

    logger.error("Extension pairing redemption rate limit failed", {error: toLogError(error)});
    throw new ExtensionPairingRateLimitUnavailableError();
  }
}

async function enforceLimit(limiter: Ratelimit, identifier: string) {
  let result: Awaited<ReturnType<Ratelimit["limit"]>>;

  try {
    result = await limiter.limit(identifier);
  } catch (error) {
    logger.error("Extension pairing rate limiter request failed", {error: toLogError(error)});
    throw new ExtensionPairingRateLimitUnavailableError();
  }

  if (!result.success) {
    logger.warn("Extension pairing rate limit exceeded", {identifier, reset: result.reset});
    throw new ExtensionPairingRateLimitError(result.reset);
  }
}
