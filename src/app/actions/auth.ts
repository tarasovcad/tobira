// app/actions/auth-actions.ts
"use server";

import {Redis} from "@upstash/redis";
import {Ratelimit} from "@upstash/ratelimit";
import {authClient} from "@/components/utils/better-auth/auth-client"; // server-side client
import {getIp} from "@/lib/ip";

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
    };
  }

  const res = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: "sign-in",
  });

  if (res.error) {
    return {error: res.error.message ?? "Failed to send OTP"};
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
    };
  }

  const res = await authClient.signIn.emailOtp({email, otp});

  if (res.error) {
    return {error: res.error.message ?? "Invalid code"};
  }

  return {success: true};
}
