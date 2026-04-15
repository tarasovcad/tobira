import { getBearerToken, getQueryId } from "@/lib/x-config";

const USER_FEATURES = {
  hidden_profile_subscriptions_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  subscriptions_verification_info_is_identity_verified_enabled: true,
  subscriptions_verification_info_verified_since_enabled: true,
  highlights_tweets_tab_ui_enabled: true,
  responsive_web_twitter_article_notes_tab_enabled: true,
  subscriptions_feature_can_gift_premium: true,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
};

async function xHeaders(authToken: string, ct0: string) {
  const bearerToken = await getBearerToken();
  return {
    Authorization: `Bearer ${bearerToken}`,
    "x-csrf-token": ct0,
    Cookie: `auth_token=${authToken}; ct0=${ct0}`,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "en",
    "content-type": "application/json",
  };
}

export async function checkXAuth() {
  // check if the user is authenticated on X (true or false)
  const cookies = await browser.cookies.getAll({ domain: "x.com" });
  const hasAuthToken = cookies.some((c) => c.name === "auth_token");
  const hasCsrf = cookies.some((c) => c.name === "ct0");
  return { connected: hasAuthToken && hasCsrf };
}

export async function fetchXUser() {
  const cookies = await browser.cookies.getAll({ domain: "x.com" });
  const authToken = cookies.find((c) => c.name === "auth_token")?.value;
  const ct0 = cookies.find((c) => c.name === "ct0")?.value;
  const twid = cookies.find((c) => c.name === "twid")?.value; // user id

  if (!authToken || !ct0 || !twid) {
    return { error: "Missing auth cookies" };
  }

  // twid = "u%3D1859371339687264256" → userId = "1859371339687264256"
  const userId = decodeURIComponent(twid).replace("u=", "");
  const queryId = await getQueryId("UserByRestId");

  const variables = encodeURIComponent(
    JSON.stringify({ userId, withSafetyModeUserFields: true })
  );
  const features = encodeURIComponent(JSON.stringify(USER_FEATURES));

  try {
    const res = await fetch(
      `https://x.com/i/api/graphql/${queryId}/UserByRestId?variables=${variables}&features=${features}`,
      { headers: await xHeaders(authToken, ct0) }
    );

    const data = await res.json();
    const result = data?.data?.user?.result;

    if (!result) return { error: "User not found in response" };

    return {
      name: result.core?.name,
      screenName: result.core?.screen_name,
      avatar: result.avatar?.image_url?.replace("_normal", "_400x400"),
      userId,
    };
  } catch (e) {
    return { error: String(e) };
  }
}
