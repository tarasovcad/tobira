import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import React from "react";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  console.log(data);
  return <AppShell session={data}>Avatar Icon</AppShell>;
};

export default page;
