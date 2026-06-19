"use client";

import {useEffect, useState} from "react";
import type {Collection} from "@/app/actions/collections";
import type {SidebarTag} from "@/features/home/types";
import {SidebarMain} from "./SidebarMain";
import {SidebarSettings} from "./SidebarSettings";
import {cn} from "@/lib/utils";
import {useSidebarStore, type SidebarMode} from "@/store/use-sidebar-store";
import {AnimatePresence, motion} from "framer-motion";
import {consumeSidebarSwitchTarget} from "./sidebar-switch-animation";
import {DEFAULT_SIDEBAR_PREFERENCES, type SidebarPreferences} from "@/lib/sidebar-preferences";

const SIDEBAR_WIDTH = "224px";
const SIDEBAR_WIDTH_ICON = "60px";

export function Sidebar({
  allCollections,
  allTags,
  isAuthenticated = false,
  userId,
  mode = "main",
  allowModeSwitch = false,
  initialPreferences = DEFAULT_SIDEBAR_PREFERENCES,
}: {
  allCollections?: Collection[];
  allTags?: SidebarTag[];
  isAuthenticated?: boolean;
  userId?: string;
  mode?: SidebarMode;
  allowModeSwitch?: boolean;
  initialPreferences?: SidebarPreferences;
}) {
  const [animateInitial] = useState(() => consumeSidebarSwitchTarget(mode));
  const isOpen = useSidebarStore((state) => state.isOpen);
  const initialized = useSidebarStore((state) => state.initialized);
  const preferences = useSidebarStore((state) => state.preferences);
  const initializePreferences = useSidebarStore((state) => state.initializePreferences);
  const requestedMode = useSidebarStore((state) => state.requestedMode);
  const requestMode = useSidebarStore((state) => state.requestMode);
  const activePreferences = initialized ? preferences : initialPreferences;
  const sidebarIsOpen = initialized ? isOpen : !initialPreferences.collapsed;
  const contentState = sidebarIsOpen ? "expanded" : "collapsed";
  const currentMode = allowModeSwitch && requestedMode ? requestedMode : mode;

  useEffect(() => {
    initializePreferences(initialPreferences);
  }, [initialPreferences, initializePreferences]);

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
              preferences={activePreferences}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
