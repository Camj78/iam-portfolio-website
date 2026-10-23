import { NextResponse, type NextRequest } from "next/server";
import { LITE_PATH, MOBILE_UA, VIEW_COOKIE } from "@/lib/view";

/** Serves the lightweight home page to phones and tablets at the same URL (see lib/view.ts). */
export function proxy(request: NextRequest) {
  const asked = request.nextUrl.searchParams.get("view");
  const chosen = asked === "lite" || asked === "full" ? asked : request.cookies.get(VIEW_COOKIE)?.value;
  const mobile = request.headers.get("sec-ch-ua-mobile") === "?1" || MOBILE_UA.test(request.headers.get("user-agent") ?? "");
  const lite = chosen === "lite" || (chosen !== "full" && mobile);

  const response = lite ? NextResponse.rewrite(new URL(LITE_PATH, request.url)) : NextResponse.next();
  if (asked === "lite" || asked === "full") {
    response.cookies.set(VIEW_COOKIE, asked, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

export const config = { matcher: "/" };
