// app/actions/auth-actions.ts
"use server";

import {Redis} from "@upstash/redis";
import {Ratelimit} from "@upstash/ratelimit";
import {getIp} from "@/lib/utils/ip";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {trackServerEvent} from "@/lib/analytics/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Separate limiters by vector (IP and email) per action
const sendOtpIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 OTP sends per 10 min
  prefix: "rl:send-otp:ip",
});

const sendOtpEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 OTP sends per 10 min
  prefix: "rl:send-otp:email",
});

const verifyOtpIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 min
  prefix: "rl:verify-otp:ip",
});

const verifyOtpEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 min
  prefix: "rl:verify-otp:email",
});

export async function sendOtpAction(email: string) {
  const ip = await getIp();
  const [ipLimit, emailLimit] = await Promise.all([
    sendOtpIpLimiter.limit(ip),
    sendOtpEmailLimiter.limit(email),
  ]);

  if (!ipLimit.success || !emailLimit.success) {
    const reset = Math.max(ipLimit.reset, emailLimit.reset);
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    return {
      error: `Too many requests. Please try again in ${retryAfterSeconds}s.`,
      errorCode: "rate_limited",
      rateLimited: true,
      cooldownSeconds: retryAfterSeconds,
    };
  }

  let res;
  try {
    res = await auth.api.sendVerificationOTP({
      body: {email, type: "sign-in"},
      headers: await headers(),
    });
  } catch {
    return {error: "Failed to send OTP", errorCode: "send_failed"};
  }

  if (!res.success) {
    return {error: "Failed to send OTP", errorCode: "send_failed"};
  }

  return {success: true};
}

export async function verifyOtpAction(email: string, otp: string) {
  const ip = await getIp();
  const [ipLimit, emailLimit] = await Promise.all([
    verifyOtpIpLimiter.limit(ip),
    verifyOtpEmailLimiter.limit(email),
  ]);

  if (!ipLimit.success || !emailLimit.success) {
    const reset = Math.max(ipLimit.reset, emailLimit.reset);
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    return {
      error: `Too many attempts. Please try again in ${retryAfterSeconds}s.`,
      errorCode: "rate_limited",
      rateLimited: true,
      cooldownSeconds: retryAfterSeconds,
    };
  }

  try {
    await auth.api.signInEmailOTP({
      body: {email, otp},
      headers: await headers(),
    });
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Invalid code",
      errorCode: "invalid_otp",
    };
  }

  return {success: true};
}

export async function signOutAction() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  try {
    await auth.api.signOut({
      headers: requestHeaders,
    });
    await trackServerEvent("user_signed_out", {success: true}, {userId: session?.user?.id});
    return {success: true};
  } catch (err) {
    await trackServerEvent(
      "user_signed_out",
      {success: false, error_code: "sign_out_failed"},
      {userId: session?.user?.id},
    );
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to sign out",
      errorCode: "sign_out_failed",
    };
  }
}
