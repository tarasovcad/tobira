import {betterAuth} from "better-auth";
import {emailOTP} from "better-auth/plugins";
import {nextCookies} from "better-auth/next-js";
import {Resend} from "resend";
import {drizzleAdapter} from "@better-auth/drizzle-adapter";

import {db} from "@/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      aiContext: {type: "string"},
      enableAiOptimization: {type: "boolean", default: true},
    },
  },
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
            subject: `${otp} - Your Tobira verification code`,
            html: `
                <div style="margin: 0; padding: 0; background-color: #ffffff;">
                  <div style="margin: 0 auto; max-width: 896px; padding: 48px 24px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    <div style="text-align: center;">
                      <img src="https://tobira.app/logo/dark-logo.svg" width="35" height="35" alt="Tobira" style="margin: 0 auto 24px; display: block;" />
                      <h2 style="margin: 0; color: #202020; font-size: 24px; font-weight: 500; letter-spacing: -0.02em;">
                        Welcome to Tobira
                      </h2>
                      <p style="margin: 12px auto 0; max-width: 300px; color: #71717A; font-size: 14px; line-height: 24px; text-align: center;">
                        Please verify your email address using the code below to complete account setup
                      </p>
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 32px auto 0; width: 300px; max-width: 300px; border: 1px dashed #D4D4D8; border-radius: 10px; background-color: #F8F8F8;">
                      <tr>
                        <td align="center" style="padding: 20px 16px;">
                          <p style="margin: 0; color: #202020; text-align: center; font-size: 1.875rem; line-height: 2.25rem; font-weight: 600; letter-spacing: 0.2em;">
                            ${otp}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top: 24px; text-align: center;">
                      <p style="margin: 0 auto; max-width: 300px; color: #71717A; font-size: 14px; line-height: 20px; text-align: center;">
                        If you didn't sign up for Tobira, you can safely ignore this email
                      </p>
                      <p style="margin: 16px 0 0; color: #202020; font-size: 14px; line-height: 20px;">
                        Thanks,<br />tobira.app
                      </p>
                    </div>
                  </div>
                </div>
              `,
          })
          .catch((err) => {
            console.error("[auth] Failed to send OTP email.", err);
          });
      },
    }),
    nextCookies(),
  ],
});
