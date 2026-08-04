"use client";

import {Suspense, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {getSafeReturnTo} from "@/lib/auth/redirect";
import LoginLogo from "./_components/LoginLogo";
import LoginHeader from "./_components/LoginHeader";
import EmailLoginForm from "./_components/EmailLoginForm";
import OtpForm from "./_components/OtpForm";
import SocialSignInErrorHandler from "./_components/SocialSignInErrorHandler";

type LoginStep = "email" | "otp";

const LoginPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const [step, setStep] = useState<LoginStep>("email");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleEmailSuccess = (email: string) => {
    setSubmittedEmail(email);
    setStep("otp");
  };

  const handleOtpVerified = () => {
    router.replace(returnTo);
  };

  const handleBack = () => {
    setStep("email");
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <Suspense fallback={null}>
        <SocialSignInErrorHandler />
      </Suspense>
      <div className="flex w-full max-w-[450px] flex-col items-center px-8">
        <LoginLogo />
        <LoginHeader step={step} email={submittedEmail} />

        {step === "email" ? (
          <EmailLoginForm
            defaultEmail={submittedEmail}
            onSuccess={handleEmailSuccess}
            returnTo={returnTo}
          />
        ) : (
          <OtpForm email={submittedEmail} onBack={handleBack} onVerified={handleOtpVerified} />
        )}
      </div>
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={null}>
    <LoginPageContent />
  </Suspense>
);

export default LoginPage;
