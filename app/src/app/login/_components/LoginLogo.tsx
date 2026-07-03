"use client";

import Image from "next/image";

const LoginLogo = () => (
  <div className="mb-4 flex items-center justify-center">
    <div className="border-muted-foreground/40 relative flex h-15 w-15 items-center justify-center rounded-lg border border-dashed">
      <Image
        src="/logo/dark-logo.svg"
        alt="Tobira Logo"
        width={32}
        height={32}
        className="dark:invert"
      />
    </div>
  </div>
);

export default LoginLogo;