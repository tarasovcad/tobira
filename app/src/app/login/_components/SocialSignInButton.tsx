"use client";

import Image from "next/image";
import {Button} from "@/components/ui/coss/button";
import Spinner from "@/components/ui/app/spinner";

type SocialProvider = "google" | "github";

type SocialSignInButtonProps = {
  provider: SocialProvider;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
};

const getProviderConfig = (provider: SocialProvider) =>
  provider === "google"
    ? {label: "Continue with Google", logo: "/google.svg", invertInDark: false}
    : {label: "Continue with GitHub", logo: "/github.svg", invertInDark: true};

const SocialSignInButton = ({
  provider,
  isLoading,
  disabled,
  onClick,
}: SocialSignInButtonProps) => {
  const {label, logo, invertInDark} = getProviderConfig(provider);

  return (
    <Button
      className="w-full rounded-lg"
      variant="outline"
      size="lg"
      type="button"
      onClick={onClick}
      disabled={disabled}>
      {isLoading ? (
        <div className="flex h-[20px] w-[20px] items-center justify-center">
          <Spinner className="size-4" />
        </div>
      ) : (
        <Image
          src={logo}
          alt={`${provider} Logo`}
          width={20}
          height={20}
          className={invertInDark ? "dark:invert" : undefined}
        />
      )}
      {label}
    </Button>
  );
};

export default SocialSignInButton;