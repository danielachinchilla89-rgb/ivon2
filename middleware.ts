import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALE_COOKIE = "NEXT_LOCALE";

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|GPTBot|ChatGPT-User|ClaudeBot|Claude-Web|PerplexityBot|Google-Extended|Anthropic-AI|cohere-ai|CCBot|Bytespider|Applebot/i;

function prefersEnglish(acceptLanguage: string | null): boolean {
  if (!acceptLanguage) return false;

  const languages = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qValue] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: qValue ? parseFloat(qValue) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  const top = languages[0];
  if (!top) return false;
  return top.tag.startsWith("en") && !top.tag.startsWith("es");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/") {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent && BOT_PATTERN.test(userAgent)) {
    return NextResponse.next();
  }

  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (existingLocale) {
    if (existingLocale === "en") {
      const url = request.nextUrl.clone();
      url.pathname = "/en";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (prefersEnglish(acceptLanguage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/en";
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, "en", { maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, "es", { maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}

export const config = {
  matcher: "/",
};
