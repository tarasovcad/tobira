"use client";

import {useState} from "react";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button} from "@/components/ui/coss/button";
import {Field, FieldLabel} from "@/components/ui/coss/field";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/other/InputOtp";
import Spinner from "@/components/ui/app/spinner";
import {toastManager} from "@/components/ui/coss/toast";
import {verifyOtpAction} from "@/app/actions/auth";
import {otpFormSchema, type OtpFormValues} from "../_lib/schemas";

type OtpFormProps = {
  email: string;
  onBack: () => void;
  onVerified: () => void;
};

const OtpForm = ({email, onBack, onVerified}: OtpFormProps) => {
  const [isVerified, setIsVerified] = useState(false);

  const {
    control,
    handleSubmit,
    clearErrors,
    setError,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<OtpFormValues>({
    mode: "onChange",
    resolver: zodResolver(otpFormSchema),
    defaultValues: {otp: ""},
  });

  const onSubmit = async ({otp}: OtpFormValues) => {
    clearErrors("otp");
    setIsVerified(false);

    const res = await verifyOtpAction(email, otp);

    if (res.error) {
      setError("otp", {type: "server", message: res.error});
      toastManager.add({title: res.error, type: "error"});
      return;
    }

    toastManager.add({title: "OTP verified successfully", type: "success"});
    setIsVerified(true);
    onVerified();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4" noValidate>
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
              onChange={(value) => {
                clearErrors("otp");
                field.onChange(value);
              }}
              aria-invalid={!!errors.otp}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              autoFocus>
              <InputOTPGroup>
                {Array.from({length: 6}, (_, i) => (
                  <InputOTPSlot key={i} index={i} className="size-12" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          )}
        />
        {errors.otp && (
          <div
            className="text-destructive mt-1 flex shrink-0 items-center gap-1.5 text-sm"
            role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.99967 1.33333C11.6815 1.33333 14.6663 4.31809 14.6663 7.99999C14.6663 11.6819 11.6815 14.6667 7.99967 14.6667C4.31777 14.6667 1.33301 11.6819 1.33301 7.99999C1.33301 4.31809 4.31777 1.33333 7.99967 1.33333ZM7.99967 9.73306C7.55787 9.73306 7.19954 10.0914 7.19954 10.5332C7.19961 10.9749 7.55787 11.3333 7.99967 11.3333C8.44147 11.3333 8.79974 10.975 8.79981 10.5332C8.79981 10.0914 8.44147 9.73306 7.99967 9.73306ZM7.99967 4.66666C7.46867 4.66667 7.05821 5.13198 7.12401 5.65885L7.43781 8.17059C7.47327 8.45399 7.71407 8.66666 7.99967 8.66666C8.28527 8.66666 8.52607 8.45399 8.56154 8.17059L8.87601 5.65885C8.94174 5.13201 8.53061 4.66666 7.99967 4.66666Z"
                fill="currentColor"
              />
            </svg>
            {errors.otp.message}
          </div>
        )}
      </Field>

      <div className="space-y-2">
        <Button
          className="w-full rounded-lg"
          variant="default"
          size="lg"
          type="submit"
          disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isVerified ? "Verified!" : "Verify code"}
        </Button>
        <Button
          className="w-full"
          variant="ghost"
          size="lg"
          type="button"
          onClick={() => {
            reset();
            onBack();
          }}
          disabled={isSubmitting}>
          Back to email
        </Button>
      </div>
      <div className="text-muted-foreground flex items-center justify-center gap-0.5 text-sm">
        <span>Didn&apos;t receive a code? </span>
        <Button
          variant="link"
          type="button"
          className="text-foreground hit-area-2! h-auto p-0 text-sm"
          disabled={isSubmitting}>
          Resend
        </Button>
      </div>
    </form>
  );
};

export default OtpForm;