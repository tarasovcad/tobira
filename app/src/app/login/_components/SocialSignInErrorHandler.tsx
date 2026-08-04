"use client";

import {useEffect, useRef} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import {toastManager} from "@/components/ui/coss/toast";
import {getLoginPath, getSafeReturnTo} from "@/lib/auth/redirect";

const SOCIAL_SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  no_code: "No authorization code was returned. Please try again.",
  invalid_code: "The authorization code was invalid. Please try again.",
  oauth_provider_not_found: "The sign-in provider is not configured. Please try another method.",
  unable_to_get_user_info:
    "Unable to retrieve your account info from the provider. Please try again.",
  email_not_found: "The provider did not return an email address.",
  unable_to_link_account:
    "Unable to link this account. It may already be linked to another account.",
  account_already_linked_to_different_user: "This account is already linked to a different user.",
  no_callback_url: "No callback URL was provided. Please try again.",
  invalid_callback_request: "Invalid callback request. Please try again.",
  state_not_found: "The sign-in session expired. Please try again.",
  state_security_mismatch: "Sign-in state mismatch. Please try again.",
  please_restart_the_process: "Sign-in failed. Please restart the process.",
};

const SocialSignInErrorHandler = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error || handledRef.current) return;
    handledRef.current = true;

    const description = searchParams.get("error_description");
    const detail =
      SOCIAL_SIGN_IN_ERROR_MESSAGES[error] ??
      description ??
      "Social sign-in failed. Please try again.";

    toastManager.add({
      title: "Social sign-in failed",
      description: detail,
      type: "error",
    });

    router.replace(getLoginPath(getSafeReturnTo(searchParams.get("returnTo"))));
  }, [searchParams, router]);

  return null;
};

export default SocialSignInErrorHandler;
