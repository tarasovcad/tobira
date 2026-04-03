import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import FaviconFinder from "./FaviconFinder";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <AppShell session={data}>
      <FaviconFinder />
    </AppShell>
  );
};

export default page;
