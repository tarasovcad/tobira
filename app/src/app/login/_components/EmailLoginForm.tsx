"use client";

import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Input} from "@/components/ui/coss/input";
import {Button} from "@/components/ui/coss/button";
import {Field, FieldLabel} from "@/components/ui/coss/field";
import Spinner from "@/components/ui/app/spinner";
import {toastManager} from "@/components/ui/coss/toast";
import {emailFormSchema, type EmailFormValues} from "../_lib/schemas";
import SocialSignInButton from "./SocialSignInButton";
import {useSocialSignIn} from "../_hooks/useSocialSignIn";
import {sendOtpAction} from "@/app/actions/auth";

type EmailLoginFormProps = {
  defaultEmail?: string;
  onSuccess: (email: string) => void;
};

const EmailLoginForm = ({defaultEmail = "", onSuccess}: EmailLoginFormProps) => {
  const {isGoogleLoading, isGithubLoading, signInWithGoogle, signInWithGithub} = useSocialSignIn();

  const {
    control,
    handleSubmit,
    clearErrors,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<EmailFormValues>({
    mode: "onChange",
    resolver: zodResolver(emailFormSchema),
    defaultValues: {email: defaultEmail},
  });

  const isAnyActionPending = isSubmitting || isGoogleLoading || isGithubLoading;

  const onSubmit = async ({email}: EmailFormValues) => {
    clearErrors("email");

    const res = await sendOtpAction(email);

    if (res.error) {
      setError("email", {type: "server", message: res.error});
      toastManager.add({title: res.error, type: "error"});
      return;
    }

    toastManager.add({title: "OTP sent successfully", type: "success"});
    onSuccess(email);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[380px] space-y-2.5" noValidate>
      <div className="flex flex-col gap-3">
        <SocialSignInButton
          provider="google"
          isLoading={isGoogleLoading}
          disabled={isAnyActionPending}
          onClick={signInWithGoogle}
        />
        <SocialSignInButton
          provider="github"
          isLoading={isGithubLoading}
          disabled={isAnyActionPending}
          onClick={signInWithGithub}
        />
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
          <Controller
            name="email"
            control={control}
            render={({field}) => (
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                size="lg"
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(event) => {
                  field.onChange(event);
                  clearErrors("email");
                }}
                error={errors.email?.message}
              />
            )}
          />
        </Field>
        <Button
          className="w-full rounded-lg"
          variant="default"
          size="lg"
          type="submit"
          disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Send me a code
        </Button>
      </div>
    </form>
  );
};

export default EmailLoginForm;
