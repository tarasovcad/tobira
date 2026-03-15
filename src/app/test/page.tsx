import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import React from "react";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <AppShell session={data}>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="mx-auto max-w-4xl space-y-8 px-6 py-12 sm:px-10">
          <div className="space-y-3 text-center">
            <svg
              width="35"
              height="35"
              className="mx-auto mb-6"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17.1882 0.000351886C17.2598 0.000621092 17.2598 0.000621092 17.3329 0.000895735C22.1256 0.021911 26.5711 1.93493 29.9438 5.32422C30.4101 5.8026 30.8318 6.30906 31.2331 6.84228C31.262 6.8801 31.291 6.91793 31.3208 6.95692C33.0294 9.19589 33.0294 9.19589 33.0294 9.85097C22.7033 9.85097 12.3772 9.85097 1.73817 9.85097C1.81412 9.62352 1.87375 9.45049 1.98446 9.24731C2.00985 9.20065 2.03523 9.15403 2.0614 9.10597C2.10219 9.0326 2.10219 9.0326 2.14381 8.95776C2.17223 8.90656 2.20065 8.85531 2.22995 8.80254C2.83662 7.72302 3.58394 6.7279 4.40373 5.8008C4.43027 5.77065 4.45683 5.74045 4.48417 5.7094C5.1633 4.94267 5.90763 4.23738 6.72951 3.6248C6.8039 3.56931 6.87799 3.5134 6.9518 3.45717C9.06894 1.84611 11.5409 0.784144 14.1496 0.289651C14.2246 0.275392 14.2996 0.261131 14.3768 0.246439C15.314 0.0757961 16.2356 -0.00608551 17.1882 0.000351886Z"
                fill="#131316"
              />
              <path
                d="M0.132382 15.6458C4.83103 15.6458 9.52974 15.6458 14.3708 15.6458C14.3708 22.0327 14.3708 28.4196 14.3708 35C10.3926 34.5593 6.44588 32.0491 3.95901 28.971C3.82372 28.7999 3.69222 28.6262 3.56122 28.4521C3.53125 28.4126 3.50128 28.3732 3.47041 28.3325C3.01174 27.7266 2.60607 27.104 2.23896 26.439C2.17137 26.317 2.10233 26.1958 2.03296 26.0746C1.17399 24.5483 0.605478 22.8337 0.281304 21.1182C0.267646 21.046 0.253988 20.9738 0.239916 20.8993C0.0686839 19.9334 -0.00369227 18.9718 0.000996742 17.9915C0.00162333 17.8363 0.000995947 17.6812 0.000258939 17.526C0.000335729 17.4236 0.000484611 17.3211 0.000712972 17.2187C0.000477692 17.1742 0.00024241 17.1298 0 17.0838C0.00399405 16.5943 0.0738545 16.1419 0.132382 15.6458Z"
                fill="#131316"
              />
              <path
                d="M20.4552 15.6458C25.1529 15.6458 29.8508 15.6458 34.6908 15.6458C34.825 16.7827 34.825 16.7827 34.8246 17.2085C34.8249 17.2572 34.8251 17.3059 34.8256 17.3561C34.8262 17.5104 34.8259 17.6645 34.8253 17.8188C34.8251 17.8722 34.825 17.9254 34.8249 17.9804C34.8221 18.8364 34.7744 19.668 34.6328 20.5134C34.6238 20.5733 34.6147 20.6331 34.6054 20.6949C33.9494 25.0386 31.4732 29.1215 27.9507 31.7551C27.9112 31.7849 27.8717 31.8147 27.8308 31.8455C27.2233 32.303 26.599 32.7074 25.9322 33.0734C25.8097 33.1408 25.6883 33.2096 25.5668 33.2789C24.14 34.0773 22.1228 35 20.4552 35C20.4552 28.6131 20.4552 22.2262 20.4552 15.6458Z"
                fill="#131316"
              />
            </svg>

            <h2 className="text-foreground text-2xl font-medium tracking-tight">
              Welcome to Tobira
            </h2>
            <p className="text-muted-foreground mx-auto max-w-[300px] text-sm leading-6">
              Please verify your email address using the code below to complete account setup
            </p>
          </div>

          <div className="bg-muted/40 flex items-center justify-center rounded-lg border border-dashed px-4 py-5">
            <p className="text-foreground text-center text-2xl font-semibold tracking-[0.2em] sm:text-3xl">
              947531
            </p>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-muted-foreground mx-auto max-w-[300px] text-sm">
              If you didn&apos;t sign up for Tobira, you can safely ignore this email
            </p>
            <p className="text-foreground text-sm">
              Thanks,
              <br />
              tobira.app
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default page;
