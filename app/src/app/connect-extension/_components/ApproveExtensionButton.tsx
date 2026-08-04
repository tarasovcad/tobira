"use client";

import {useActionState, useEffect} from "react";

import {Button} from "@/components/ui/coss/button";
import Spinner from "@/components/ui/app/spinner";
import {approveExtensionPairing} from "@/app/actions/extension-pairing";
import {
  initialExtensionPairingApprovalState,
  type ExtensionPairingApprovalState,
} from "@/app/actions/extension-pairing-state";

type ApproveExtensionButtonProps = {
  code: string;
  onApproved: () => void;
};

type ApprovalErrorStatus = Exclude<ExtensionPairingApprovalState["status"], "idle" | "approved">;

const EXTENSION_PAIRING_APPROVED = "TOBIRA_EXTENSION_PAIRING_APPROVED";

export function ApproveExtensionButton({code, onApproved}: ApproveExtensionButtonProps) {
  const [state, formAction, isPending] = useActionState(
    approveExtensionPairing,
    initialExtensionPairingApprovalState,
  );

  useEffect(() => {
    if (state.status !== "approved") return;

    // This is only a wake-up signal. The extension keeps the device token locally
    // and must redeem it through the server before it receives any credential.
    window.postMessage(
      {
        type: EXTENSION_PAIRING_APPROVED,
        code,
      },
      window.location.origin,
    );
    onApproved();
  }, [code, onApproved, state.status]);

  if (state.status === "approved") return null;

  return (
    <>
      <form action={formAction} className="mt-8 space-y-2">
        <input type="hidden" name="code" value={code} />
        <Button type="submit" size="default" className="w-full rounded-lg" disabled={isPending}>
          {isPending && <Spinner />}
          {isPending ? "Connecting..." : "Connect extension"}
        </Button>
      </form>

      {state.status !== "idle" && <ApprovalError status={state.status} />}
    </>
  );
}

function ApprovalError({status}: {status: ApprovalErrorStatus}) {
  return (
    <p className="text-destructive mt-4 text-center text-sm" role="alert">
      {getApprovalMessage(status)}
    </p>
  );
}

function getApprovalMessage(
  status:
    | "unauthenticated"
    | "invalid-code"
    | "not-found"
    | "expired"
    | "used"
    | "cancelled"
    | "rate-limited"
    | "error",
) {
  switch (status) {
    case "unauthenticated":
      return "Sign in to Tobira before connecting the extension.";
    case "invalid-code":
      return "This connection code is invalid. Start again from the extension.";
    case "not-found":
      return "This connection request was not found. Start again from the extension.";
    case "expired":
      return "This connection code has expired. Start again from the extension.";
    case "used":
      return "This connection request has already been used.";
    case "cancelled":
      return "This connection request was cancelled.";
    case "rate-limited":
      return "Too many connection attempts. Please wait a moment and try again.";
    case "error":
      return "The extension could not be connected. Please try again.";
  }
}
