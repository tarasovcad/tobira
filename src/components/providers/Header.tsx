"use client";

import React from "react";
import {Button, buttonVariants} from "../shadcn/button";
import ThemeSwitch from "../other/ThemeSwitch";
import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import type {Session} from "better-auth";
import {Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger} from "@/components/coss-ui/menu";
import {useMutation} from "@tanstack/react-query";
import {authClient} from "@/components/utils/better-auth/auth-client";
import {toastManager} from "@/components/coss-ui/toast";

export type AppShellSession = {
  session: Session;
  user?: {
    email?: string | null;
  } | null;
} | null;

export function Header({session}: {session: AppShellSession}) {
  const email = session?.user?.email ?? null;
  const userInitial = email?.trim()?.[0]?.toUpperCase() ?? "?";
  const router = useRouter();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.signOut();
      if (res.error) throw res.error;
      return res;
    },
    onSuccess: () => {
      toastManager.add({title: "Signed out", type: "success"});
      router.refresh();
      router.push("/login");
    },
    onError: (err) => {
      toastManager.add({
        title: "Failed to sign out",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    },
  });

  return (
    <div className="flex items-center justify-between border-b px-6 py-3.5">
      <div className="text-foreground flex flex-1">
        <Link
          href="/home"
          className="hit-area-2 hover:bg-muted-strong/80 rounded-md p-1 transition-colors duration-50 ease-out">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.7862 0.000241294C11.8353 0.000425892 11.8353 0.000425892 11.8854 0.000614218C15.1718 0.0150247 18.2202 1.32681 20.5329 3.65089C20.8526 3.97892 21.1418 4.3262 21.417 4.69184C21.4368 4.71778 21.4567 4.74373 21.4771 4.77046C22.6487 6.30574 22.6487 6.30574 22.6487 6.75496C15.568 6.75496 8.48722 6.75496 1.19189 6.75496C1.24397 6.59898 1.28486 6.48035 1.36077 6.341C1.37818 6.30902 1.39559 6.27704 1.41353 6.2441C1.4415 6.19379 1.4415 6.19379 1.47004 6.14247C1.48953 6.10735 1.50902 6.07222 1.52911 6.03604C1.94511 5.29578 2.45756 4.61342 3.0197 3.97769C3.0379 3.95701 3.05611 3.93632 3.07486 3.91502C3.54055 3.38926 4.05096 2.90563 4.61453 2.48558C4.66554 2.44753 4.71633 2.40919 4.76695 2.37063C6.21871 1.2659 7.91378 0.537698 9.70261 0.198618C9.75401 0.18884 9.80541 0.179061 9.85837 0.168987C10.501 0.0519745 11.133 -0.00417293 11.7862 0.000241294Z"
              fill="currentColor"
            />
            <path
              d="M0.0907762 10.7285C3.31272 10.7285 6.53467 10.7285 9.85425 10.7285C9.85425 15.1081 9.85425 19.4877 9.85425 24C7.12633 23.6978 4.42004 21.9765 2.71475 19.8658C2.62198 19.7485 2.53181 19.6294 2.44198 19.51C2.42143 19.4829 2.40088 19.4559 2.37971 19.428C2.06519 19.0125 1.78702 18.5856 1.53529 18.1296C1.48894 18.0459 1.4416 17.9628 1.39403 17.8797C0.805026 16.8331 0.415185 15.6574 0.192894 14.481C0.183529 14.4315 0.174163 14.382 0.164514 14.3309C0.0470974 13.6686 -0.00253184 13.0092 0.000683479 12.337C0.00111314 12.2306 0.000682934 12.1242 0.000177558 12.0178C0.000230214 11.9476 0.000332306 11.8773 0.000488894 11.8071C0.000327559 11.7766 0.000166224 11.7461 0 11.7146C0.00273878 11.3789 0.0506431 11.0687 0.0907762 10.7285Z"
              fill="currentColor"
            />
            <path
              d="M14.0264 10.7285C17.2477 10.7285 20.4691 10.7285 23.788 10.7285C23.88 11.5081 23.88 11.5081 23.8797 11.8001C23.8799 11.8335 23.8801 11.8669 23.8804 11.9013C23.8808 12.0071 23.8806 12.1128 23.8802 12.2186C23.8801 12.2552 23.88 12.2917 23.8799 12.3294C23.878 12.9164 23.8453 13.4866 23.7482 14.0663C23.742 14.1074 23.7358 14.1484 23.7294 14.1908C23.2796 17.1693 21.5816 19.969 19.1662 21.7749C19.1391 21.7953 19.112 21.8158 19.084 21.8369C18.6674 22.1506 18.2393 22.4279 17.7821 22.6789C17.6981 22.7251 17.6148 22.7723 17.5315 22.8198C16.5531 23.3673 15.1699 24 14.0264 24C14.0264 19.6204 14.0264 15.2408 14.0264 10.7285Z"
              fill="currentColor"
            />
          </svg>
        </Link>
      </div>
      <InputGroup className="w-full max-w-[340px]">
        <InputGroupInput
          aria-label="Search"
          placeholder="Search"
          type="search"
          autoComplete="off"
        />
        <InputGroupAddon>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </InputGroupAddon>
      </InputGroup>
      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeSwitch />

        {session ? (
          <Menu>
            <MenuTrigger
              aria-label="User menu"
              className={cn(buttonVariants({variant: "outline", size: "icon-sm"}), "rounded-full")}
              type="button">
              {userInitial}
            </MenuTrigger>
            <MenuPopup align="end" className="w-44">
              <MenuItem
                onClick={() => {
                  router.push("/favorites");
                }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M11.3245 1.66454C10.7912 0.556155 9.20781 0.556155 8.67456 1.66454L6.86368 5.42816C6.83245 5.49308 6.76926 5.5397 6.69416 5.54952L2.52885 6.09405C1.30664 6.25383 0.806898 7.75978 1.71091 8.61084L4.75525 11.4769C4.80877 11.5273 4.83199 11.6 4.81892 11.67L4.05425 15.7654C3.82669 16.9843 5.11807 17.9028 6.1972 17.322L9.89373 15.3323C9.95956 15.2968 10.0395 15.2968 10.1053 15.3323L13.8018 17.322C14.881 17.9028 16.1724 16.9843 15.9448 15.7654L15.1801 11.67C15.1671 11.6 15.1903 11.5273 15.2438 11.4769L18.2881 8.61084C19.1921 7.75978 18.6924 6.25383 17.4702 6.09405L13.3049 5.54952C13.2298 5.5397 13.1666 5.49308 13.1354 5.42816L11.3245 1.66454Z"
                    fill="currentColor"
                  />
                </svg>
                Favorites
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                variant="destructive"
                disabled={signOutMutation.isPending}
                onClick={() => signOutMutation.mutate()}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14 8C14 8.1326 13.9473 8.2598 13.8535 8.35353L10.8535 11.3535C10.6583 11.5488 10.3417 11.5488 10.1465 11.3535C9.9512 11.1583 9.9512 10.8417 10.1465 10.6465L12.2929 8.5H6C5.72386 8.5 5.5 8.27613 5.5 8C5.5 7.72387 5.72386 7.5 6 7.5H12.2929L10.1465 5.35355C9.9512 5.15829 9.9512 4.84171 10.1465 4.64645C10.3417 4.45118 10.6583 4.45118 10.8535 4.64645L13.8535 7.64647C13.9473 7.7402 14 7.8674 14 8Z"
                    fill="currentColor"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 2.5C8 2.77614 7.77613 3 7.5 3H4.5C3.67157 3 3 3.67157 3 4.5V11.5C3 12.3284 3.67157 13 4.5 13H7.5C7.77613 13 8 13.2239 8 13.5C8 13.7761 7.77613 14 7.5 14H4.5C3.11929 14 2 12.8807 2 11.5V4.5C2 3.11929 3.11929 2 4.5 2H7.5C7.77613 2 8 2.22386 8 2.5Z"
                    fill="currentColor"
                  />
                </svg>
                Sign out
              </MenuItem>
            </MenuPopup>
          </Menu>
        ) : (
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
