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

const extensionPairingApprovalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(20, "1 m", 20),
  prefix: "rl:extension-pairing:approval:user:minute",
});

const extensionConnectionMinuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(300, "1 m", 300),
  prefix: "rl:extension-connection:credential:minute",
});

const extensionConnectionIpMinuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(600, "1 m", 600),
  prefix: "rl:extension-connection:ip:minute",
});

export class ExtensionPairingRateLimitError extends Error {
  constructor(
    public readonly reset: number,
    message = "Too many extension pairing requests. Please try again later.",
  ) {
    super(message);
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
  await enforceLimits("Extension pairing rate limit failed", [
    [extensionPairingMinuteLimiter, identifier],
    [extensionPairingHourLimiter, identifier],
  ]);
}

export async function enforceExtensionPairingRedeemRateLimit(ip: string, credentialHash: string) {
  await enforceLimits("Extension pairing redemption rate limit failed", [
    [extensionPairingRedeemMinuteLimiter, ip],
    [extensionPairingRedeemTokenLimiter, credentialHash.slice(0, 16)],
  ]);
}

export async function enforceExtensionPairingApprovalRateLimit(userId: string) {
  await enforceLimits("Extension pairing approval rate limit failed", [
    [extensionPairingApprovalLimiter, userId],
  ]);
}

export async function enforceExtensionConnectionRateLimit(ip: string, credentialHash: string) {
  await enforceLimits("Extension connection rate limit failed", [
    [extensionConnectionIpMinuteLimiter, ip],
    [extensionConnectionMinuteLimiter, credentialHash.slice(0, 16)],
  ]);
}

async function enforceLimits(message: string, limits: ReadonlyArray<readonly [Ratelimit, string]>) {
  try {
    for (const [limiter, identifier] of limits) {
      await enforceLimit(limiter, identifier);
    }
  } catch (error) {
    if (
      error instanceof ExtensionPairingRateLimitError ||
      error instanceof ExtensionPairingRateLimitUnavailableError
    ) {
      throw error;
    }

    logger.error(message, {error: toLogError(error)});
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
