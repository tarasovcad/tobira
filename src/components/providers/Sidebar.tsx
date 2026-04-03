"use client";

import {useState} from "react";
import {usePathname} from "next/navigation";
import type {Collection} from "@/app/actions/collections";
import type {SidebarTag} from "@/app/home/_types";
import {SidebarMain} from "./SidebarMain";
import {SidebarSettings} from "./SidebarSettings";
import {AnimatePresence, motion} from "framer-motion";
import {cn} from "@/lib/utils/classnames";
import {useSidebarStore} from "@/store/use-sidebar-store";
import {useHasMounted} from "@/lib/hooks/use-has-mounted";

const SIDEBAR_WIDTH = "224px";
const SIDEBAR_WIDTH_ICON = "60px";

export function Sidebar({
  allCollections,
  allTags,
  isAuthenticated = false,
  userId,
}: {
  allCollections?: Collection[];
  allTags?: SidebarTag[];
  isAuthenticated?: boolean;
  userId?: string;
}) {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [showSettings, setShowSettings] = useState(pathname.startsWith("/settings"));
  const hasMounted = useHasMounted();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const sidebarIsOpen = hasMounted ? isOpen : true;
  const contentState = sidebarIsOpen ? "expanded" : "collapsed";

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (pathname.startsWith("/settings")) {
      setShowSettings(true);
    } else if (prevPathname.startsWith("/settings") && !pathname.startsWith("/settings")) {
      setShowSettings(false);
    }
  }

  return (
    <aside
      className={cn(
        "bg-muted/30 relative h-full shrink-0 overflow-hidden border-r transition-[width] duration-200 ease-linear",
      )}
      style={{
        width: sidebarIsOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON,
      }}>
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
            <SidebarSettings onBack={() => setShowSettings(false)} state={contentState} />
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
              onShowSettings={() => setShowSettings(true)}
              state={contentState}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
