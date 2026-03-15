import {betterAuth} from "better-auth";
import {Pool} from "pg";
import {emailOTP} from "better-auth/plugins";
import {nextCookies} from "better-auth/next-js";
import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: new Pool({connectionString: process.env.DATABASE_URL}),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    emailOTP({
      storeOTP: "hashed",
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      async sendVerificationOTP({email, otp}) {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.error("[auth] Missing RESEND_API_KEY; cannot send OTP email.");
          return;
        }

        void resend.emails
          .send({
            from: "Tobira <noreply@tobira.app>",
            to: email,
            subject: `Your sign-in code: ${otp}`,
            text: `Your one-time sign-in code is: ${otp}\n\nIt expires in 5 minutes.`,
          })
          .catch((err) => {
            console.error("[auth] Failed to send OTP email.", err);
          });
      },
    }),
    nextCookies(),
  ],
});
