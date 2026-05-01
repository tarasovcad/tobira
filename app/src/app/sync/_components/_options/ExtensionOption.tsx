"use client";

import Image from "next/image";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/coss/button";
import Spinner from "@/components/ui/app/spinner";
import {useExtensionConnectionStore} from "@/store/use-extension-connection-store";

type ConnectionStatus = "idle" | "checking" | "connected" | "error";

interface ExtensionOptionProps {
  connectionStatus: ConnectionStatus;
  onVerify: () => void | Promise<void>;
  onReVerify: () => void | Promise<void>;
}

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const ExtensionOption = ({connectionStatus, onVerify, onReVerify}: ExtensionOptionProps) => {
  const extensionError = useExtensionConnectionStore((state) => state.error);
  const extensionUser = useExtensionConnectionStore((state) => state.user);
  const avatarAlt = extensionUser ? `${extensionUser.name} avatar` : "X profile avatar";
  const avatarFallback = extensionUser
    ? getInitials(extensionUser.name || extensionUser.screenName)
    : "X";

  return (
    <>
      <div className="mb-3">
        {[
          "Install the Tobira extension from the Chrome Web Store",
          "Log in to X - the extension captures your active session",
          "Click verify - Tobira confirms your identity without moving any data",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="flex flex-col items-center self-stretch">
              <div className="bg-highlight flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] leading-none font-semibold text-white">
                {i + 1}
              </div>
              {i < 2 && <div className="bg-border my-1 min-h-4 w-px flex-1" />}
            </div>
            <p className={cn("text-secondary -mt-0.5 text-sm", i < 2 && "pb-3")}>{step}</p>
          </div>
        ))}
      </div>

      <Button
        size="default"
        variant="default"
        disabled={connectionStatus === "checking" || connectionStatus === "connected"}
        onClick={onVerify}
        className="mt-2 w-full">
        {connectionStatus === "checking" && <Spinner className="size-4" />}
        {connectionStatus === "idle" && "Verify connection"}
        {connectionStatus === "error" && "Try again"}
        {connectionStatus === "checking" && "Checking..."}
        {connectionStatus === "connected" && "Verified"}
      </Button>

      {connectionStatus === "connected" && extensionUser && (
        <div className="border-border mt-3 flex items-center gap-3 rounded-[10px] border px-3.5 py-3">
          <div className="bg-highlight relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-semibold text-white">
            {extensionUser.avatar ? (
              <Image
                src={extensionUser.avatar}
                alt={avatarAlt}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              avatarFallback
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-foreground truncate text-sm font-[550]">{extensionUser.name}</p>
            <p className="text-secondary truncate text-[13px]">@{extensionUser.screenName}</p>
          </div>
          <button
            type="button"
            onClick={onReVerify}
            className="text-muted-foreground shrink-0 cursor-pointer text-[13px] transition-opacity hover:opacity-70">
            Re-verify
          </button>
        </div>
      )}

      {connectionStatus === "error" && extensionError && (
        <p className="mt-3 text-center text-sm text-red-400">{extensionError}</p>
      )}

      {connectionStatus !== "connected" && (
        <p className="text-muted-foreground mt-3 text-center text-sm">
          Don&apos;t have the extension?{" "}
          <Button
            size="sm"
            variant="link"
            className="text-foreground px-0 underline underline-offset-2 transition-opacity hover:opacity-70">
            Download it here
          </Button>
        </p>
      )}
    </>
  );
};
