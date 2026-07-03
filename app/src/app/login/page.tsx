"use client";

import {Suspense, useState} from "react";
import {useRouter} from "next/navigation";
import LoginLogo from "./_components/LoginLogo";
import LoginHeader from "./_components/LoginHeader";
import EmailLoginForm from "./_components/EmailLoginForm";
import OtpForm from "./_components/OtpForm";
import SocialSignInErrorHandler from "./_components/SocialSignInErrorHandler";

type LoginStep = "email" | "otp";

const LoginPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleEmailSuccess = (email: string) => {
    setSubmittedEmail(email);
    setStep("otp");
  };

  const handleOtpVerified = () => {
    router.push("/home");
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
          <EmailLoginForm defaultEmail={submittedEmail} onSuccess={handleEmailSuccess} />
        ) : (
          <OtpForm email={submittedEmail} onBack={handleBack} onVerified={handleOtpVerified} />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
