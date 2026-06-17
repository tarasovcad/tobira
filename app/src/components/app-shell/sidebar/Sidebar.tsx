"use client";

import {useState} from "react";
import type {Collection} from "@/app/actions/collections";
import type {SidebarTag} from "@/features/home/types";
import {SidebarMain} from "./SidebarMain";
import {SidebarSettings} from "./SidebarSettings";
import {cn} from "@/lib/utils";
import {useSidebarStore, type SidebarMode} from "@/store/use-sidebar-store";
import {useHasMounted} from "@/lib/hooks/use-has-mounted";
import {AnimatePresence, motion} from "framer-motion";
import {consumeSidebarSwitchTarget} from "./sidebar-switch-animation";

const SIDEBAR_WIDTH = "224px";
const SIDEBAR_WIDTH_ICON = "60px";

export function Sidebar({
  allCollections,
  allTags,
  isAuthenticated = false,
  userId,
  mode = "main",
  allowModeSwitch = false,
}: {
  allCollections?: Collection[];
  allTags?: SidebarTag[];
  isAuthenticated?: boolean;
  userId?: string;
  mode?: SidebarMode;
  allowModeSwitch?: boolean;
}) {
  const [animateInitial] = useState(() => consumeSidebarSwitchTarget(mode));
  const hasMounted = useHasMounted();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const requestedMode = useSidebarStore((state) => state.requestedMode);
  const requestMode = useSidebarStore((state) => state.requestMode);
  const sidebarIsOpen = hasMounted ? isOpen : true;
  const contentState = sidebarIsOpen ? "expanded" : "collapsed";
  const currentMode = allowModeSwitch && requestedMode ? requestedMode : mode;

  const handleBackToMain = () => {
    requestMode("main");
  };

  return (
    <aside
      className={cn(
        "bg-muted/30 relative h-full shrink-0 overflow-hidden border-r transition-[width] duration-200 ease-linear",
      )}
      style={{
        width: sidebarIsOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON,
      }}>
      <AnimatePresence initial={animateInitial} mode="sync">
        {currentMode === "settings" ? (
          <motion.div
            key="settings-sidebar"
            className="absolute inset-0"
            initial={{x: "-10%", opacity: 0, filter: "blur(16px)"}}
            animate={{x: 0, opacity: 1, filter: "blur(0px)"}}
            exit={{x: "-10%", opacity: 0, filter: "blur(16px)"}}
            transition={{
              type: "tween",
              duration: 0.16,
              ease: "easeOut",
            }}>
            <SidebarSettings onBack={handleBackToMain} state={contentState} />
          </motion.div>
        ) : (
          <motion.div
            key="main-sidebar"
            className="absolute inset-0 flex min-h-0 flex-col"
            initial={{x: "-10%", opacity: 0, filter: "blur(16px)"}}
            animate={{x: 0, opacity: 1, filter: "blur(0px)"}}
            exit={{x: "-10%", opacity: 0, filter: "blur(16px)"}}
            transition={{
              type: "tween",
              duration: 0.16,
              ease: "easeOut",
            }}>
            <SidebarMain
              allCollections={allCollections}
              allTags={allTags}
              isAuthenticated={isAuthenticated}
              userId={userId}
              state={contentState}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
