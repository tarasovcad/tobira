"use client";

import {useState} from "react";
import type {Collection} from "@/app/actions/collections";
import {SidebarTagsType} from "./SidebarTags";
import {SidebarMain} from "./SidebarMain";
import {SidebarSettings} from "./SidebarSettings";
import {AnimatePresence, motion} from "framer-motion";

export function Sidebar({
  tags: initialTags,
  collections: initialCollections,
  isAuthenticated = false,
}: {
  tags?: SidebarTagsType;
  collections?: Collection[];
  isAuthenticated?: boolean;
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside className="bg-muted/30 relative h-full w-[224px] shrink-0 overflow-hidden border-r">
      <AnimatePresence initial={false} mode="sync">
        {showSettings ? (
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
            <SidebarSettings onBack={() => setShowSettings(false)} />
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
              initialTags={initialTags}
              initialCollections={initialCollections}
              isAuthenticated={isAuthenticated}
              onShowSettings={() => setShowSettings(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
