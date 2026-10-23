/*
  Which home page a device gets: the cinematic one (/) or the lightweight one (/m).

  iOS kills the page process while it renders the cinematic chapters' 3D scenes (Stage 10: the
  Validation scene crashed with no React, no animation and no images, from its 3D geometry
  alone). Every iOS browser is WebKit, so phones and tablets get /m, a separate static page that
  never ships or mounts the 3D scenes. Desktop is untouched.

  The choice is made before any HTML is sent (src/proxy.ts, from the User-Agent, the
  Sec-CH-UA-Mobile hint and the `view` cookie), so each page hydrates its own markup. LITE_GUARD is
  the safety net on /: a touch-first device that still received the cinematic page (iPadOS asks
  for desktop sites and sends a Mac User-Agent) reloads as `?view=lite` before hydration.
  `?view=lite` or `?view=full` sets the cookie explicitly (testing, or a deliberate choice).
*/

export const VIEW_COOKIE = "view";
export const LITE_PATH = "/m";

/** Phones and tablets by User-Agent. iPadOS in desktop mode is caught by LITE_GUARD instead. */
export const MOBILE_UA = /iPhone|iPad|iPod|Android|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i;

// The reload carries ?view=lite, which the proxy honours without a cookie (and sets one), so a
// browser that blocks cookies cannot loop. An explicit view=full, in the URL or the cookie, wins.
export const LITE_GUARD = `(function(){try{
var q=location.search,c=document.cookie,ipad=navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent);
if(/[?&]view=(full|lite)(&|$)/.test(q)||/(?:^|; )view=(full|lite)(?:;|$)/.test(c))return;
if(!ipad&&!matchMedia("(hover: none) and (pointer: coarse)").matches)return;
document.documentElement.style.visibility="hidden";
if(window.stop)window.stop();
location.replace(location.pathname+(q?q+"&":"?")+"view=lite"+location.hash);
}catch(e){}})()`;
