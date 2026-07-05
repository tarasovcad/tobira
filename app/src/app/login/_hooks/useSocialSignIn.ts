"use client";

import {useState} from "react";
import {authClient} from "@/lib/auth/auth-client";
import {toastManager} from "@/components/ui/coss/toast";
import {trackClientEvent} from "@/lib/analytics/client";

type socialProvider = "google" | "github";

const socialProviders: {provider: socialProvider; label: string}[] = [
  {provider: "google", label: "Google"},
  {provider: "github", label: "GitHub"},
];

export const useSocialSignIn = () => {
  const [isLoading, setIsLoading] = useState<Record<socialProvider, boolean>>({
    google: false,
    github: false,
  });

  const signIn = async (provider: socialProvider) => {
    const label = socialProviders.find((p) => p.provider === provider)?.label ?? provider;
    setIsLoading((prev) => ({...prev, [provider]: true}));
    trackClientEvent("auth_social_started", {provider});

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/home",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      toastManager.add({
        title: `${label} sign-in failed`,
        description: `Failed to start ${label} sign-in. Please try again.`,
        type: "error",
      });
      trackClientEvent("auth_social_failed", {provider, error_code: "start_failed"});
      console.error(`[login] ${label} sign-in error`, err);
      setIsLoading((prev) => ({...prev, [provider]: false}));
    }
  };

  return {
    isGoogleLoading: isLoading.google,
    isGithubLoading: isLoading.github,
    signInWithGoogle: () => signIn("google"),
    signInWithGithub: () => signIn("github"),
  };
};
