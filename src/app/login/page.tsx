"use client";

import React, {useState} from "react";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/coss-ui/input";
import {Button} from "@/components/coss-ui/button";
import {Form} from "@/components/coss-ui/form";
import {Field, FieldLabel} from "@/components/coss-ui/field";
import {z} from "zod";
import Spinner from "@/components/shadcn/coss-ui";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/other/InputOtp";
import {authClient} from "@/components/utils/better-auth/auth-client";
import {toastManager} from "@/components/coss-ui/toast";
import {cn} from "@/lib/utils";
import {sendOtpAction, verifyOtpAction} from "@/app/actions/auth";

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpFormSchema = z.object({
  otp: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type OtpFormValues = z.infer<typeof otpFormSchema>;

const maskEmail = (rawEmail: string) => {
  const [localPart, domain] = rawEmail.split("@");
  if (!localPart || !domain) return rawEmail;

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}${"*".repeat(Math.max(1, localPart.length - 2))}@${domain}`;
};

const LoginPage = () => {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");

  const {
    register,
    handleSubmit: handleEmailSubmit,
    formState: {errors: emailErrors},
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const {
    control,
    handleSubmit: handleOtpSubmit,

    formState: {errors: otpErrors},
    reset: resetOtpForm,
  } = useForm<OtpFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handleGoogleSignIn = async () => {
    setServerError(null);
    setIsGoogleLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setServerError("Failed to start Google sign-in. Please try again.");
      toastManager.add({
        title: "Google sign-in failed",
        type: "error",
      });
      console.error("[login] Google sign-in error", err);
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setServerError(null);
    setIsGithubLoading(true);

    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/home",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setServerError("Failed to start GitHub sign-in. Please try again.");
      toastManager.add({
        title: "GitHub sign-in failed",
        type: "error",
      });
      console.error("[login] GitHub sign-in error", err);
      setIsGithubLoading(false);
    }
  };
  const handleLogin = async ({email}: EmailFormValues) => {
    setServerError(null);
    setIsLoading(true);

    const res = await sendOtpAction(email);
    setIsLoading(false);

    if (res.error) {
      setServerError(res.error);
      toastManager.add({title: res.error, type: "error"});
      return;
    }

    setSubmittedEmail(email);
    setIsOtpVerified(false);
    setStep("otp");
    toastManager.add({title: "OTP sent successfully", type: "success"});
  };

  const handleVerifyOtp = async ({otp}: OtpFormValues) => {
    setServerError(null);
    setIsOtpVerified(false);
    setIsLoading(true);

    const res = await verifyOtpAction(submittedEmail, otp);
    setIsLoading(false);

    if (res.error) {
      setServerError(res.error);
      toastManager.add({title: res.error, type: "error"});
      return;
    }

    toastManager.add({title: "OTP verified successfully", type: "success"});
    setIsOtpVerified(true);
    router.push("/home");
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-full max-w-[450px] flex-col items-center px-8">
        {/* Logo Container */}
        <div className="mb-4 flex items-center justify-center">
          <div className="border-muted-foreground/40 relative flex h-15 w-15 items-center justify-center rounded-lg border border-dashed">
            <Image
              src="/logo/dark-logo.svg"
              alt="Tobira Logo"
              width={32}
              height={32}
              className="dark:invert"
            />
          </div>
        </div>

        <h1 className="text-foreground max-w-[400px] text-center text-[26px] font-medium tracking-tight">
          {step === "email" ? "Sign in to your Tobira account" : "Enter verification code"}
        </h1>
        <p
          className={cn(
            "text-muted-foreground mt-2 max-w-[350px] text-center text-base",
            step === "email" ? "mb-8" : "mb-8",
          )}>
          {step === "email"
            ? "Build your own curated library of the internet, one bookmark at a time"
            : `We've sent a verification code to ${submittedEmail ? maskEmail(submittedEmail) : "your email"}`}
        </p>

        {step === "email" ? (
          <Form
            onSubmit={handleEmailSubmit(handleLogin)}
            className="w-full max-w-[380px] space-y-2.5">
            <div className="flex flex-col gap-3">
              <Button
                className="w-full rounded-lg"
                variant="outline"
                size="lg"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? (
                  <div className="flex h-[20px] w-[20px] items-center justify-center">
                    <Spinner className="size-4" />
                  </div>
                ) : (
                  <Image
                    src="/google.svg"
                    alt="Google Logo"
                    width={20}
                    height={20}
                    className="dark:invert"
                  />
                )}
                Continue with Google
              </Button>

              <Button
                className="w-full rounded-lg"
                variant="outline"
                size="lg"
                type="button"
                onClick={handleGithubSignIn}
                disabled={isGithubLoading || isLoading || isGoogleLoading}>
                {isGithubLoading ? (
                  <div className="flex h-[20px] w-[20px] items-center justify-center">
                    <Spinner className="size-4" />
                  </div>
                ) : (
                  <Image
                    src="/github.svg"
                    alt="GitHub Logo"
                    width={20}
                    height={20}
                    className="dark:invert"
                  />
                )}
                Continue with GitHub
              </Button>
            </div>

            <div className="relative py-1.5">
              <div className="border-border absolute inset-0 top-1/2 h-0 border-t" />
              <span className="text-muted-foreground bg-background relative mx-auto block w-fit px-2 text-sm">
                or
              </span>
            </div>

            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  size="lg"
                  {...register("email")}
                  aria-invalid={!!emailErrors.email}
                />
                {emailErrors.email && (
                  <p className="text-destructive text-xs" role="alert">
                    {emailErrors.email.message}
                  </p>
                )}
                {serverError && (
                  <p className="text-destructive text-xs" role="alert">
                    {serverError}
                  </p>
                )}
              </Field>
              <Button
                className="w-full rounded-lg"
                variant="default"
                size="lg"
                type="submit"
                disabled={isLoading}>
                {isLoading && <Spinner />}
                Send me a code
              </Button>
            </div>
          </Form>
        ) : (
          <Form onSubmit={handleOtpSubmit(handleVerifyOtp)} className="w-full space-y-4">
            <Field className="text-foreground items-center">
              <FieldLabel htmlFor="otp" className="sr-only">
                Verification code
              </FieldLabel>
              <Controller
                name="otp"
                control={control}
                render={({field}) => (
                  <InputOTP
                    id="otp"
                    maxLength={6}
                    value={field.value}
                    onChange={field.onChange}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-enable-grammarly="false"
                    autoFocus>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-12" />
                      <InputOTPSlot index={1} className="size-12" />
                      <InputOTPSlot index={2} className="size-12" />
                      <InputOTPSlot index={3} className="size-12" />
                      <InputOTPSlot index={4} className="size-12" />
                      <InputOTPSlot index={5} className="size-12" />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
              {otpErrors.otp && (
                <p className="text-destructive text-xs" role="alert">
                  {otpErrors.otp.message}
                </p>
              )}
              {serverError && (
                <p className="text-destructive text-xs" role="alert">
                  {serverError}
                </p>
              )}
            </Field>

            <div className="space-y-2">
              <Button
                className="w-full rounded-lg"
                variant="default"
                size="lg"
                type="submit"
                disabled={isLoading || isOtpVerified}>
                {isLoading && <Spinner />}
                {isOtpVerified ? "Verified!" : "Verify code"}
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                size="lg"
                type="button"
                onClick={() => {
                  setStep("email");
                  setServerError(null);
                  setIsOtpVerified(false);
                  resetOtpForm();
                }}
                disabled={isLoading}>
                Back to email
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
