const RETURN_TO_BASE_URL = "https://tobira.invalid";
const MAX_RETURN_TO_LENGTH = 2048;

export const DEFAULT_AUTH_REDIRECT = "/home";

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/login/");
}

export function getSafeReturnTo(value: string | null | undefined) {
  if (
    !value ||
    value.length > MAX_RETURN_TO_LENGTH ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const decodedValue = decodeURIComponent(value);

    if (decodedValue.startsWith("//") || decodedValue.includes("\\")) {
      return DEFAULT_AUTH_REDIRECT;
    }

    const url = new URL(value, RETURN_TO_BASE_URL);
    const decodedUrl = new URL(decodedValue, RETURN_TO_BASE_URL);

    if (
      url.origin !== RETURN_TO_BASE_URL ||
      decodedUrl.origin !== RETURN_TO_BASE_URL ||
      isLoginPath(url.pathname) ||
      isLoginPath(decodedUrl.pathname)
    ) {
      return DEFAULT_AUTH_REDIRECT;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function getLoginPath(returnTo: string | null | undefined) {
  const params = new URLSearchParams({returnTo: getSafeReturnTo(returnTo)});
  return `/login?${params.toString()}`;
}
