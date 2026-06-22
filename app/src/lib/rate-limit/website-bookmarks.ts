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
  limiter: Ratelimit.tokenBucket(120, "1 h", 200),
  prefix: "rl:website-bookmark:create:user",
});

const websiteBookmarkIpCreateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(300, "1 h", 500),
  prefix: "rl:website-bookmark:create:ip",
});

export async function enforceWebsiteBookmarkCreateRateLimit(userId: string) {
  try {
    const userLimit = await websiteBookmarkUserCreateLimiter.limit(userId);

    if (!userLimit.success) {
      throwRateLimitError(userLimit.reset);
    }

    const ip = await getIp();
    if (ip === "unknown") return;

    const ipLimit = await websiteBookmarkIpCreateLimiter.limit(ip);
    if (!ipLimit.success) {
      throwRateLimitError(ipLimit.reset);
    }
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

function throwRateLimitError(reset: number): never {
  const retryAfterMinutes = Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
  throw new WebsiteBookmarkRateLimitError(
    `Too many website bookmarks. Please try again in ${retryAfterMinutes}m.`,
  );
}
