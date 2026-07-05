"use client";

import React from "react";
import ThemeSwitch from "../other/ThemeSwitch";
import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import type {Session} from "@/lib/auth/auth-client";
import {Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger} from "@/components/ui/coss/menu";
import {useMutation} from "@tanstack/react-query";
import {signOutAction} from "@/app/actions/auth";
import {toastManager} from "@/components/ui/coss/toast";
import {Avatar} from "@/components/ui/app/avatar";
import {Button, buttonVariants} from "@/components/ui/coss/button";
import {serializeSettingsParams} from "@/lib/query-params";
import {useFloatingHoverTooltip} from "@/lib/hooks/use-floating-hover-tooltip";
import {markSidebarSwitchTarget} from "./sidebar/sidebar-switch-animation";
import {useSidebarStore} from "@/store/use-sidebar-store";
import {clearClientUser} from "@/lib/analytics/client";

export type AppShellSession = Session | null;

export function Header({session}: {session: AppShellSession}) {
  const email = session?.user?.email ?? null;
  const router = useRouter();
  const requestSidebarMode = useSidebarStore((state) => state.requestMode);
  const {getTriggerProps, tooltipRef, tooltipStyle, visible} = useFloatingHoverTooltip();
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const res = await signOutAction();
      if ("error" in res && res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      clearClientUser();
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
    <div className="bg-muted/30 flex items-center justify-between border-b px-6 py-3.5">
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="bg-popover text-foreground pointer-events-none fixed top-0 left-0 z-[9999] rounded-md border px-2.5 py-1 text-sm whitespace-nowrap"
        style={{
          ...tooltipStyle,
          transform: `scale(${visible ? 1 : 0.98})`,
        }}>
        Coming soon
      </div>
      <div className="text-foreground flex flex-1">
        <Link
          href="/home"
          aria-label="Go to home"
          className="hit-area-1.5! cursor-pointer rounded-md">
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
              className={cn(
                buttonVariants({variant: "ghost", size: "icon-sm"}),
                "overflow-hidden rounded-full p-0",
              )}
              type="button">
              <Avatar
                email={email}
                label={email}
                size={28}
                showInitials={false}
                showFrame={false}
                showUserIcon={true}
              />
            </MenuTrigger>
            <MenuPopup align="end" className="w-44">
              <MenuItem
                onClick={() => {
                  requestSidebarMode("settings");
                  markSidebarSwitchTarget("settings");
                  router.push(serializeSettingsParams("/settings", {tab: "general"}));
                }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.899 1.79361C11.5904 1.66675 11.1992 1.66675 10.4167 1.66675C9.63416 1.66675 9.24291 1.66675 8.93433 1.79361C8.52283 1.96277 8.19591 2.28723 8.02546 2.69561C7.94766 2.88203 7.91721 3.09883 7.90529 3.41507C7.88778 3.87981 7.64763 4.30999 7.24181 4.54252C6.83598 4.77505 6.34053 4.76636 5.92624 4.54905C5.64431 4.40116 5.43991 4.31893 5.23832 4.2926C4.79674 4.2349 4.35015 4.35366 3.9968 4.62275C3.73178 4.82456 3.53616 5.16083 3.14491 5.83336C2.75367 6.50589 2.55806 6.84215 2.51446 7.17084C2.45631 7.60908 2.57598 8.0523 2.84712 8.403C2.97088 8.56308 3.14481 8.69758 3.41475 8.86591C3.81159 9.11341 4.06693 9.535 4.06691 10.0001C4.06688 10.4652 3.81155 10.8867 3.41475 11.1341C3.14476 11.3025 2.97081 11.4371 2.84704 11.5972C2.5759 11.9478 2.45624 12.391 2.51437 12.8292C2.55797 13.1579 2.7536 13.4942 3.14483 14.1667C3.53607 14.8392 3.7317 15.1756 3.99671 15.3773C4.35006 15.6464 4.79666 15.7652 5.23824 15.7075C5.43981 15.6812 5.64421 15.5989 5.92611 15.4511C6.34043 15.2337 6.83591 15.2251 7.24176 15.4576C7.64761 15.6902 7.88777 16.1203 7.90529 16.5852C7.91721 16.9013 7.94766 17.1182 8.02546 17.3046C8.19591 17.7129 8.52283 18.0374 8.93433 18.2066C9.24291 18.3334 9.63416 18.3334 10.4167 18.3334C11.1992 18.3334 11.5904 18.3334 11.899 18.2066C12.3105 18.0374 12.6374 17.7129 12.8078 17.3046C12.8857 17.1182 12.9162 16.9013 12.9281 16.5851C12.9456 16.1203 13.1857 15.6902 13.5915 15.4576C13.9973 15.225 14.4928 15.2337 14.9072 15.4511C15.1891 15.5989 15.3934 15.6811 15.595 15.7074C16.0366 15.7652 16.4832 15.6464 16.8365 15.3773C17.1016 15.1755 17.2972 14.8392 17.6884 14.1667C18.0797 13.4942 18.2752 13.1579 18.3189 12.8292C18.377 12.391 18.2573 11.9477 17.9862 11.5971C17.8624 11.437 17.6885 11.3024 17.4185 11.1341C17.0217 10.8867 16.7664 10.4651 16.7664 10C16.7664 9.53491 17.0217 9.1135 17.4185 8.86608C17.6886 8.69766 17.8625 8.56316 17.9863 8.403C18.2574 8.05236 18.3771 7.60914 18.319 7.17089C18.2753 6.84221 18.0797 6.50594 17.6885 5.83341C17.2972 5.16089 17.1017 4.82462 16.8365 4.62275C16.4832 4.35366 16.0366 4.2349 15.595 4.2926C15.3934 4.31893 15.189 4.40118 14.9072 4.54908C14.4928 4.76641 13.9973 4.77504 13.5916 4.54253C13.1858 4.31002 12.9457 3.87979 12.9281 3.41497C12.9162 3.09883 12.8857 2.88204 12.8079 2.69561C12.6374 2.28723 12.3105 1.96277 11.899 1.79361ZM10.4167 13.3334C12.1726 13.3334 13.5834 11.9226 13.5834 10.1667C13.5834 8.41084 12.1726 7.00008 10.4167 7.00008C8.66079 7.00008 7.25004 8.41084 7.25004 10.1667C7.25004 11.9226 8.66079 13.3334 10.4167 13.3334Z"
                    fill="currentColor"
                  />
                </svg>
                Settings
              </MenuItem>
              <div {...getTriggerProps()}>
                <MenuItem disabled>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8 1.33334C5.40401 1.33334 3.26405 3.36898 3.13441 5.96173L3.02179 8.21421C3.01257 8.39848 2.96521 8.57888 2.88269 8.74394L2.12732 10.2547C2.04359 10.4221 2 10.6067 2 10.794C2 11.4601 2.53995 12 3.20601 12H4.73335C5.04219 13.5215 6.38736 14.6667 8 14.6667C9.61267 14.6667 10.9578 13.5215 11.2667 12H12.794C13.4601 12 14 11.4601 14 10.794C14 10.6067 13.9564 10.4221 13.8727 10.2547L13.1173 8.74394C13.0348 8.57888 12.9874 8.39848 12.9782 8.21421L12.8656 5.96173C12.7359 3.36898 10.596 1.33334 8 1.33334ZM8 13.3333C7.1292 13.3333 6.38836 12.7768 6.11381 12H9.8862C9.61167 12.7768 8.8708 13.3333 8 13.3333Z"
                      fill="currentColor"
                    />
                  </svg>
                  Notifications
                </MenuItem>
              </div>
              <div {...getTriggerProps()}>
                <MenuItem disabled>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.66764 2.00001L11.3343 2C12.8071 2 14.001 3.19391 14.001 4.66667V10.0239C14.001 11.4966 12.8071 12.6905 11.3343 12.6905H10.2501L8.42348 14.2039C8.17561 14.4092 7.81648 14.4082 7.56988 14.2014L5.76739 12.6905H4.66764C3.19488 12.6905 2.00098 11.4966 2.00098 10.0239V4.66668C2.00098 3.19392 3.19488 2.00001 4.66764 2.00001ZM8.66621 5.33333C8.66621 4.96514 8.36768 4.66667 7.99954 4.66667C7.63134 4.66667 7.33288 4.96514 7.33288 5.33333V6.66665H5.99952C5.63132 6.66665 5.33285 6.96513 5.33285 7.33333C5.33285 7.70153 5.63132 8 5.99952 8H7.33288V9.33333C7.33288 9.70153 7.63134 10 7.99954 10C8.36768 10 8.66621 9.70153 8.66621 9.33333V8H9.99954C10.3677 8 10.6662 7.70153 10.6662 7.33333C10.6662 6.96513 10.3677 6.66665 9.99954 6.66665H8.66621V5.33333Z"
                      fill="currentColor"
                    />
                  </svg>
                  Changelog
                </MenuItem>
              </div>
              <div {...getTriggerProps()}>
                <MenuItem disabled>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M5.99967 5.66666V5.99999H5.66634C5.48225 5.99999 5.33301 5.85075 5.33301 5.66666C5.33301 5.48257 5.48225 5.33333 5.66634 5.33333C5.85043 5.33333 5.99967 5.48257 5.99967 5.66666Z"
                      fill="currentColor"
                    />
                    <path
                      d="M7.33301 8.66666V7.33333H8.66634V8.66666H7.33301Z"
                      fill="currentColor"
                    />
                    <path
                      d="M5.66634 10H5.99967V10.3333C5.99967 10.5174 5.85043 10.6667 5.66634 10.6667C5.48225 10.6667 5.33301 10.5174 5.33301 10.3333C5.33301 10.1493 5.48225 10 5.66634 10Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10 10.3333V10H10.3333C10.5174 10 10.6667 10.1493 10.6667 10.3333C10.6667 10.5174 10.5174 10.6667 10.3333 10.6667C10.1493 10.6667 10 10.5174 10 10.3333Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10.3333 5.99999H10V5.66666C10 5.48257 10.1493 5.33333 10.3333 5.33333C10.5174 5.33333 10.6667 5.48257 10.6667 5.66666C10.6667 5.85075 10.5174 5.99999 10.3333 5.99999Z"
                      fill="currentColor"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.66667 2C3.19391 2 2 3.19391 2 4.66667V11.3333C2 12.8061 3.19391 14 4.66667 14H11.3333C12.8061 14 14 12.8061 14 11.3333V4.66667C14 3.19391 12.8061 2 11.3333 2H4.66667ZM5.66667 4C4.74619 4 4 4.74619 4 5.66667C4 6.58714 4.74619 7.33333 5.66667 7.33333H6V8.66667H5.66667C4.74619 8.66667 4 9.41287 4 10.3333C4 11.2538 4.74619 12 5.66667 12C6.58714 12 7.33333 11.2538 7.33333 10.3333V10H8.66667V10.3333C8.66667 11.2538 9.41287 12 10.3333 12C11.2538 12 12 11.2538 12 10.3333C12 9.41287 11.2538 8.66667 10.3333 8.66667H10V7.33333H10.3333C11.2538 7.33333 12 6.58714 12 5.66667C12 4.74619 11.2538 4 10.3333 4C9.41287 4 8.66667 4.74619 8.66667 5.66667V6H7.33333V5.66667C7.33333 4.74619 6.58714 4 5.66667 4Z"
                      fill="currentColor"
                    />
                  </svg>
                  Shortcuts
                </MenuItem>
              </div>
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
