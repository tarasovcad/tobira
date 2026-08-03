"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";

import {revokeConnectedExtension} from "@/app/actions/extension-connections";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/coss/alert-dialog";
import {Button} from "@/components/ui/coss/button";
import Spinner from "@/components/ui/app/spinner";
import {SettingsFrame, SettingsLabel} from "./SettingsUI";
import type {ExtensionConnection} from "@/lib/auth/extension-connections";

type ConnectedExtensionsProps = {
  connections: ExtensionConnection[];
};

export function ConnectedExtensions({connections}: ConnectedExtensionsProps) {
  const router = useRouter();
  const [selectedConnection, setSelectedConnection] = useState<ExtensionConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    if (!isPending) {
      setSelectedConnection(null);
      setError(null);
    }
  }

  function handleRevoke() {
    if (!selectedConnection) return;

    setError(null);
    startTransition(async () => {
      const result = await revokeConnectedExtension({apiKeyId: selectedConnection.id});
      if (!result.success) {
        setError(result.error);
        return;
      }

      setSelectedConnection(null);
      router.refresh();
    });
  }

  return (
    <SettingsFrame title="Connected Extensions">
      <div className="space-y-4">
        <SettingsLabel
          title="Browser access"
          description="Review and revoke extensions that can access your Tobira account."
        />

        {connections.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            No browser extensions are connected to your account.
          </p>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="bg-muted/32 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{connection.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDevice(connection)} · v{connection.device?.extensionVersion ?? "unknown"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Connected {formatDate(connection.createdAt)} · Last used{" "}
                    {formatLastUsed(connection.lastRequest)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {connection.expiresAt
                      ? `Expires ${formatDate(connection.expiresAt)}`
                      : "Does not expire"}
                    {connection.device?.installationId &&
                      ` · ID ${connection.device.installationId.slice(0, 8)}`}
                  </p>
                </div>

                <Button
                  variant="destructive-outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setSelectedConnection(connection);
                  }}>
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={selectedConnection !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this extension?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedConnection?.name ?? "This extension"} will stop accessing your Tobira
              account. You can connect it again later.
            </AlertDialogDescription>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" disabled={isPending} />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" onClick={handleRevoke} disabled={isPending}>
              {isPending && <Spinner className="size-4 animate-spin" />}
              {isPending ? "Revoking..." : "Revoke extension"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </SettingsFrame>
  );
}

function formatDevice(connection: ExtensionConnection) {
  const device = connection.device;
  if (!device) return "Chrome extension";

  return `Chrome on ${formatPlatform(device.os)} (${formatArchitecture(device.architecture)})`;
}

function formatPlatform(value: string) {
  if (value === "android") return "Android";
  if (value === "cros") return "ChromeOS";
  if (value === "fuchsia") return "Fuchsia";
  if (value === "linux") return "Linux";
  if (value === "mac") return "macOS";
  if (value === "openbsd") return "OpenBSD";
  if (value === "win") return "Windows";
  return value;
}

function formatArchitecture(value: string) {
  return value.replace("x86-", "x86/");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {dateStyle: "medium"}).format(new Date(value));
}

function formatLastUsed(value: string | null) {
  return value ? formatDate(value) : "never";
}
