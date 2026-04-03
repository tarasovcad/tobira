import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import PreviewFinder from "./PreviewFinder";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <AppShell session={data}>
      <PreviewFinder />
    </AppShell>
  );
};

export default page;
