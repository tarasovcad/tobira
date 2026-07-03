"use client";

import {cn} from "@/lib/utils";

type LoginHeaderProps = {
  step: "email" | "otp";
  email: string;
};

const LoginHeader = ({step, email}: LoginHeaderProps) => (
  <>
    <h1 className="text-foreground max-w-[400px] text-center text-[26px] font-medium tracking-tight">
      {step === "email" ? "Sign in to your Tobira account" : "Enter verification code"}
    </h1>
    <p
      className={cn(
        "text-muted-foreground mt-2 max-w-[350px] text-center text-base",
        step === "email" ? "mb-8" : "mb-6",
      )}>
      {step === "email"
        ? "Build your own curated library of the internet, one bookmark at a time"
        : `We've sent a verification code to ${email || "your email"}`}
    </p>
  </>
);

export default LoginHeader;