import {Ratelimit} from "@upstash/ratelimit";
import {redis} from "@/lib/cache/redis";
import {logger, toLogError} from "@/lib/shared/logger";
import {getIp} from "@/lib/utils/ip";

class WebsiteBookmarkRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebsiteBookmarkRateLimitError";
  }
}

const websiteBookmarkUserCreateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(60, "1 h", 100),
  prefix: "rl:website-bookmark:create:user",
});

const websiteBookmarkUserCreateBurstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(10, "1 m", 10),
  prefix: "rl:website-bookmark:create:user:burst",
});

const websiteBookmarkIpCreateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(180, "1 h", 250),
  prefix: "rl:website-bookmark:create:ip",
});

const websiteBookmarkIpCreateBurstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(30, "1 m", 30),
  prefix: "rl:website-bookmark:create:ip:burst",
});

export async function enforceWebsiteBookmarkCreateRateLimit(userId: string) {
  try {
    await enforceLimit(websiteBookmarkUserCreateBurstLimiter, userId, {
      scope: "user",
      window: "minute",
      userId,
    });

    await enforceLimit(websiteBookmarkUserCreateLimiter, userId, {
      scope: "user",
      window: "hour",
      userId,
    });

    const ip = await getIp();
    if (ip === "unknown") return;

    await enforceLimit(websiteBookmarkIpCreateBurstLimiter, ip, {
      scope: "ip",
      window: "minute",
      userId,
      ip,
    });

    await enforceLimit(websiteBookmarkIpCreateLimiter, ip, {
      scope: "ip",
      window: "hour",
      userId,
      ip,
    });
  } catch (error) {
    if (error instanceof WebsiteBookmarkRateLimitError) {
      throw error;
    }

    logger.error("Website bookmark create rate limit failed", {
      userId,
      error: toLogError(error),
    });

    throw new Error("Website bookmark creation is temporarily unavailable. Please try again soon.");
  }
}

async function enforceLimit(
  limiter: Ratelimit,
  identifier: string,
  context: {
    scope: "user" | "ip";
    window: "minute" | "hour";
    userId: string;
    ip?: string;
  },
) {
  const result = await limiter.limit(identifier);

  if (!result.success) {
    logger.warn("Website bookmark create rate limit exceeded", {
      ...context,
      reset: result.reset,
    });
    throwRateLimitError(result.reset);
  }
}

function throwRateLimitError(reset: number): never {
  const retryAfterMinutes = Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
  throw new WebsiteBookmarkRateLimitError(
    `Too many website bookmarks. Please try again in ${retryAfterMinutes}m.`,
  );
}
