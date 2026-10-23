/*
  Which home page a device gets: the cinematic one (/) or the lightweight one (/m).

  iOS kills the page process while it renders the cinematic chapters' 3D scenes (Stage 10: the
  Validation scene crashed with no React, no animation and no images, from its 3D geometry
  alone). Every iOS browser is WebKit, so phones and tablets get /m, a separate static page that
  never ships or mounts the 3D scenes. Desktop is untouched.

  The choice is made before any HTML is sent (src/proxy.ts, from the User-Agent, the
  Sec-CH-UA-Mobile hint and the `view` cookie), so each page hydrates its own markup. LITE_GUARD is
  the safety net on /: a touch-first device that still received the cinematic page (iPadOS asks
  for desktop sites and sends a Mac User-Agent) records `view=lite` and reloads before hydration.
  `?view=lite` or `?view=full` sets the cookie explicitly (testing, or a deliberate choice).
*/

export const VIEW_COOKIE = "view";
export const LITE_PATH = "/m";

/** Phones and tablets by User-Agent. iPadOS in desktop mode is caught by LITE_GUARD instead. */
export const MOBILE_UA = /iPhone|iPad|iPod|Android|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i;

export const LITE_GUARD = `(function(){try{
var c=document.cookie,ipad=navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent);
if(/(?:^|; )view=full(?:;|$)/.test(c))return;
if(!ipad&&!matchMedia("(hover: none) and (pointer: coarse)").matches)return;
if(/(?:^|; )view=lite(?:;|$)/.test(c))return;
document.cookie="view=lite; path=/; max-age=31536000; samesite=lax";
document.documentElement.style.visibility="hidden";
if(window.stop)window.stop();
location.replace(location.pathname+location.search+location.hash);
}catch(e){}})()`;
