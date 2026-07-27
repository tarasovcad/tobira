"use client";

import {ChromeSyncSetupSheet} from "./_providers/chrome/ChromeSyncSetupSheet";
import {XSyncSetupSheet} from "./_providers/x/XSyncSetupSheet";

export default function SyncSetupSheet({userId}: {userId?: string | null}) {
  return (
    <>
      <XSyncSetupSheet userId={userId} />
      <ChromeSyncSetupSheet userId={userId} />
    </>
  );
}
