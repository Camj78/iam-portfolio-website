"""
The Access Lounge: depth plates cut from the existing podcast cover.

    xcrun swift scripts/lounge-segment.swift assets-src/podcast/access-lounge-cover.png assets-src/lounge/person-mask.png
    python3 scripts/prepare-lounge.py

Nothing is generated: every pixel of the hosts, microphones, laptop and mug is
the cover's own. The person mask comes from Apple Vision (on-device). Plates:

  room     the studio with the hosts, foreground and baked-in type removed
           (push-pull fill), extended sideways to a 16:9-ish frame, softened
           a little for depth of field.
  host-1   left host, with the body behind the mic and laptop filled in and a
  host-2   soft contact shadow, so a few px of parallax never shows a hole.
  mic-1    the foreground: microphones (boom, stand, heads), laptop and mug,
  mic-2    straight from the cover with alpha from the person mask.
  desk
  wing-l   soft darkness the studio falls off into, riding on each host's
  wing-r   plane, so the cover's cut through the outer shoulder never shows.
  desk-front  the cover's lit desk edge carried across the frame.

Coordinates: the "studio frame" (SF) is the framing at the reveal, in cover px.
SF x = cover x + EXT, SF y = cover y - TOP. Written to src/content/lounge-plates.json.
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

COVER = "assets-src/podcast/access-lounge-cover.png"
MASK = "assets-src/lounge/person-mask.png"
OUT = "public/lounge/optimized"
DEBUG = "assets-src/lounge"

TOP, BOTTOM = 90, 1220                 # cover rows inside the frame
FH = BOTTOM - TOP
FW = int(round(FH * 1.82))             # 1440x790-ish frame
EXT = (FW - 1254) // 2                 # room added each side
DESK_Y = 1148                          # cover row of the desk's front edge

cover = np.asarray(Image.open(COVER).convert("RGB")).astype(np.float32) / 255
person = np.asarray(Image.open(MASK).convert("L")).astype(np.float32) / 255
H0, W0 = person.shape
yy, xx = np.mgrid[0:H0, 0:W0]


def poly(points, size=(W0, H0)):
    im = Image.new("L", size, 0)
    ImageDraw.Draw(im).polygon(points, fill=255)
    return np.asarray(im).astype(np.float32) / 255


def ellipse(cx, cy, rx, ry, size=(W0, H0)):
    im = Image.new("L", size, 0)
    ImageDraw.Draw(im).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    return np.asarray(im).astype(np.float32) / 255


def rect(x0, y0, x1, y1, size=(W0, H0)):
    return poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], size)


def _box(a, r, axis):
    """Box filter of radius r along one axis, edges clamped."""
    if r < 1:
        return a
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis, dtype=np.float64)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return ((hi - lo) / (2 * r + 1)).astype(np.float32)


def blur(a, sigma):
    """Gaussian blur (three box passes) on 2D or HxWxC float arrays."""
    if sigma <= 0:
        return a
    r = max(1, int(round(np.sqrt(12 * sigma * sigma / 3 + 1) / 2 - 0.5)))
    for _ in range(3):
        a = _box(_box(a, r, 0), r, 1)
    return a


def dilate(a, r):
    return np.clip(blur((a > 0.5).astype(np.float32), r) * 3, 0, 1)


def resize(a, w, h):
    if a.ndim == 2:
        return np.asarray(Image.fromarray(a.astype(np.float32), "F").resize((w, h), Image.BILINEAR))
    return np.stack([resize(a[..., c], w, h) for c in range(a.shape[2])], -1)


def pushpull(img, known):
    """Fill unknown pixels from their surroundings, coarse to fine."""
    levels = [(img * known[..., None], known)]
    while min(levels[-1][1].shape) > 8:
        c, w = levels[-1]
        h, wd = w.shape[0] // 2 * 2, w.shape[1] // 2 * 2
        c = c[:h, :wd]; w = w[:h, :wd]
        c2 = (c[0::2, 0::2] + c[1::2, 0::2] + c[0::2, 1::2] + c[1::2, 1::2]) / 4
        w2 = (w[0::2, 0::2] + w[1::2, 0::2] + w[0::2, 1::2] + w[1::2, 1::2]) / 4
        levels.append((c2, w2))
    c, w = levels[-1]
    est = c / np.maximum(w, 1e-6)[..., None]
    for c, w in reversed(levels[:-1]):
        up = resize(est, w.shape[1], w.shape[0])
        a = np.clip(w * 4, 0, 1)[..., None]
        est = a * (c / np.maximum(w, 1e-6)[..., None]) + (1 - a) * up
    out = img.copy()
    k = known[..., None]
    return out * k + est[: img.shape[0], : img.shape[1]] * (1 - k)


# ---------------------------------------------------------------- the person mask
pm = np.clip((person - 0.12) / 0.7, 0, 1)
pm[520:770, 500:770] = 0                       # the globe is not a person
# Arms resting on the desk: Vision is unsure of the sleeves, but they are plainly the hosts.
arm1 = poly([(55, 1052), (322, 1046), (334, DESK_Y + 2), (55, DESK_Y + 2)])
arm2 = poly([(1000, 1036), (1254, 1026), (1254, DESK_Y + 2), (1000, DESK_Y + 2)])
pm = np.maximum(pm, np.maximum(arm1, arm2))
host1 = pm * (xx < 700)
host2 = pm * (xx >= 700)

# ---------------------------------------------------------------- the foreground
mic1_poly = np.clip(
    ellipse(316, 786, 70, 72)
    + poly([(236, 822), (350, 830), (346, 930), (330, 1000), (290, 1012), (252, 1066), (205, 1066), (222, 990), (240, 920)])
    + poly([(0, 732), (0, 795), (90, 842), (175, 868), (262, 866), (262, 822), (175, 800), (118, 770)])
    + ellipse(104, 802, 26, 28)
    + rect(78, 806, 118, DESK_Y + 4), 0, 1)
mic2_poly = np.clip(
    ellipse(1160, 858, 68, 70)
    + poly([(1130, 880), (1214, 856), (1254, 856), (1254, 1050), (1222, 1052), (1172, 968), (1138, 930)]), 0, 1)
laptop_poly = poly([(378, 970), (868, 945), (872, 1000), (872, DESK_Y + 4), (298, DESK_Y + 4), (306, 1130)])
mug_poly = poly([(758, 994), (992, 994), (996, DESK_Y + 4), (758, DESK_Y + 4)])

hard_person = np.clip((person - 0.35) / 0.3, 0, 1)
mic1_a = mic1_poly * (1 - hard_person)
mic1_a = np.maximum(mic1_a, rect(78, 806, 118, DESK_Y + 4))     # the stand pole is solid
mic1_a = np.maximum(mic1_a, ellipse(316, 786, 66, 68) * 0.98)   # so is the foam head
mic2_a = np.maximum(mic2_poly * (1 - hard_person), ellipse(1160, 858, 64, 66) * 0.98)
desk_a = np.maximum(laptop_poly, mug_poly * (1 - hard_person * (xx > 920)))
for a in (mic1_a, mic2_a, desk_a):
    a[:] = blur(a, 0.8)
# The cover's frame cuts through both mics: fade them into the side wings instead.
edge_fade = lambda d: np.clip(d / 140, 0, 1) ** 1.5
mic1_a *= edge_fade(xx)
mic2_a *= edge_fade(W0 - 1 - xx)

# ---------------------------------------------------------------- hosts, filled behind the foreground
below = (yy > 690)
fill1 = dilate(mic1_poly + laptop_poly * (xx < 600), 10) * below * (xx < 640)
fill2 = dilate(mic2_poly + mug_poly * (xx > 820) + laptop_poly * (xx > 790), 10) * below * (xx >= 700)


def host_plate(m, fill, x0, x1):
    a = np.clip(np.maximum(m, fill), 0, 1)
    # Continue the body under the desk edge, so parallax never lifts it clear.
    a[DESK_Y - 6:, :] = np.maximum(a[DESK_Y - 6:, :], a[DESK_Y - 7:DESK_Y - 6, :])
    known = (m > 0.6).astype(np.float32)          # every pixel Vision is sure of stays; only the holes are filled
    rgb = pushpull(cover, known)
    rgb[DESK_Y - 6:] = rgb[DESK_Y - 7:DESK_Y - 6]
    a[:, :x0] = 0; a[:, x1:] = 0
    return rgb, a


h1_rgb, h1_a = host_plate(host1, fill1, 0, 700)
h2_rgb, h2_a = host_plate(host2, fill2, 700, W0)

# ---------------------------------------------------------------- the room
type_mask = np.clip(
    rect(240, 10, 1010, 345) + rect(255, 350, 1000, 390) + rect(440, 392, 820, 415)
    + rect(410, 438, 875, 532), 0, 1)
sign_mask = rect(1070, 292, 1254, 398)
fg_mask = np.clip(mic1_poly + mic2_poly + laptop_poly + mug_poly, 0, 1)
remove = np.clip(dilate(pm, 7) + dilate(fg_mask, 6) + type_mask + sign_mask + (yy >= DESK_Y - 4), 0, 1)
room_c = pushpull(cover, 1 - remove)
room_c[DESK_Y - 4:] = room_c[DESK_Y - 5:DESK_Y - 4] * 0.6

# Extend sideways: mirrored, darkened outward, softened.
M = 70                                       # plate margin beyond the frame
L = EXT + M
left = room_c[:, :L][:, ::-1]
right = room_c[:, -L:][:, ::-1]
room = np.concatenate([left, room_c, right], 1)
ramp = np.ones(room.shape[1], np.float32)
ramp[:L] = np.linspace(0.22, 1, L) ** 1.6
ramp[-L:] = np.linspace(1, 0.22, L) ** 1.6
room *= ramp[None, :, None]
seam = np.zeros(room.shape[:2], np.float32)
seam[:, L - 24:L + 24] = 1; seam[:, -L - 24:-L + 24] = 1
room = room * (1 - blur(seam, 10)[..., None]) + blur(room, 6) * blur(seam, 10)[..., None]
# Depth of field and a little less light than the hosts.
room = blur(room, 1.6) * 0.86
# The rows the frame shows, plus margins.
y0 = TOP - M
room = room[max(0, y0):BOTTOM + M]
pad_top = max(0, -y0)
if pad_top:
    room = np.concatenate([np.repeat(room[:1], pad_top, 0), room], 0)
if room.shape[0] < FH + 2 * M:
    room = np.concatenate([room, np.repeat(room[-1:], FH + 2 * M - room.shape[0], 0)], 0)

# ---------------------------------------------------------------- side wings and the desk front
# The cover's frame cuts through each host's outer shoulder. Past it the studio
# falls off into darkness: a soft wing that rides on that host's own plane, so
# the cut stays covered whatever the parallax. Smooth, so stored small.
WING_M = 420                                 # reach past the frame (scale margins)
WING_S = 0.25                                # stored at a quarter of frame px


def first_row(m, x0, x1):
    """The first cover row where a host reaches the cover's edge (where its cut begins)."""
    rows = np.where((m[:, x0:x1] > 0.5).any(1))[0]
    return int(rows.min()) if len(rows) else 600


def wing(side, cut_top):
    w, h = EXT + 140 + WING_M, FH + 2 * WING_M
    x = np.arange(w, dtype=np.float32)[None, :]
    y = np.arange(h, dtype=np.float32)[:, None] - WING_M + TOP     # cover rows
    cut = (w - 140 + 10) if side == "l" else (140 - 10)            # opaque up to 10 px inside the cut
    t = (cut - x) / 130 if side == "l" else (x - cut) / 130
    t = np.clip(t + 1, 0, 1)                                        # 0 at cut-130 inward ... 1 at the cut
    ramp = t * t * (3 - 2 * t)
    # Above the host's cut the extended room shows through (a medium-wide frame needs the
    # room around the hosts); from just above the cut down, the falloff is solid.
    v = np.clip((y - (cut_top - 230)) / 200, 0, 1)
    v = 0.42 + 0.58 * v * v * (3 - 2 * v)
    a = ramp * v
    rgb = np.zeros((h, w, 3), np.float32); rgb[...] = (0.012, 0.018, 0.032)
    return rgb, a


cut_l, cut_r = first_row(host1, 0, 14), first_row(host2, W0 - 14, W0)
wl_rgb, wl_a = wing("l", cut_l)
wr_rgb, wr_a = wing("r", cut_r)
print("cut rows", cut_l, cut_r)

# The desk's front: the cover's lit edge, carried across the frame, over a dark front.
DF_M = 320
strip = cover[DESK_Y - 4:DESK_Y + 4]                                 # 8 rows of lit edge
strip = np.concatenate([np.repeat(strip[:, :1], EXT + DF_M, 1), strip, np.repeat(strip[:, -1:], EXT + DF_M, 1)], 1)
fade = np.ones(strip.shape[1], np.float32)
fade[:EXT + DF_M] = np.linspace(0.15, 1, EXT + DF_M) ** 2
fade[-(EXT + DF_M):] = np.linspace(1, 0.15, EXT + DF_M) ** 2
strip = strip * fade[None, :, None]
front_h = 520
front = np.zeros((front_h, strip.shape[1], 3), np.float32)
g = np.linspace(1, 0, front_h)[:, None, None]
front[...] = np.array([0.022, 0.03, 0.05]) * (0.55 + 0.45 * g)
front[:16] += np.linspace(0.05, 0, 16)[:, None, None] * np.array([0.4, 0.5, 0.8])   # the lip catches a little light
df_rgb = np.concatenate([strip, front], 0)
df_a = np.ones(df_rgb.shape[:2], np.float32)

# ---------------------------------------------------------------- write
SCALE = 1.5   # hosts and foreground carry 1.5x the cover's pixels (Lanczos, light sharpening)


def save(name, rgb, a, box, scale, sharpen=False, quality=84):
    x0, y0, x1, y1 = box
    rgba = np.dstack([rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]])
    im = Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), "RGBA")
    if scale != 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    if sharpen:
        rgb_im = im.convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
        rgb_im.putalpha(im.getchannel("A"))
        im = rgb_im
    im.save(f"{OUT}/lounge-{name}.webp", quality=quality, method=6)
    return im


def bbox(a, pad=0):
    ys, xs = np.where(a > 0.01)
    return (max(0, xs.min() - pad), max(0, ys.min() - pad), min(a.shape[1], xs.max() + 1 + pad), min(a.shape[0], ys.max() + 1 + pad))


import os
os.makedirs(OUT, exist_ok=True)
plates = {}


def place(name, box, offset=(EXT, -TOP)):
    x0, y0, x1, y1 = box
    plates[name] = {"x": int(x0 + offset[0]), "y": int(y0 + offset[1]), "w": int(x1 - x0), "h": int(y1 - y0)}


# Hosts with a soft shadow behind them (into the room) baked in.
def with_shadow(rgb, a, pad=60):
    H, W = a.shape
    big_a = np.zeros((H + 2 * pad, W + 2 * pad), np.float32)
    big_rgb = np.zeros((H + 2 * pad, W + 2 * pad, 3), np.float32)
    big_a[pad:-pad, pad:-pad] = a
    big_rgb[pad:-pad, pad:-pad] = rgb
    sh = np.roll(blur(big_a, 22), 14, 0) * 0.55
    out_a = big_a + sh * (1 - big_a)
    out_rgb = big_rgb * (big_a / np.maximum(out_a, 1e-6))[..., None]
    return out_rgb, out_a


for name, rgb, a in (("host-1", h1_rgb, h1_a), ("host-2", h2_rgb, h2_a)):
    pad = 60
    srgb, sa = with_shadow(rgb, a, pad)
    b = bbox(sa)
    b = (b[0], b[1], b[2], min(b[3], DESK_Y + 40 + pad))
    save(name, srgb, sa, b, SCALE, sharpen=True)
    place(name, b, (EXT - pad, -TOP - pad))

for name, a in (("mic-1", mic1_a), ("mic-2", mic2_a), ("desk", desk_a)):
    b = bbox(a, 2)
    save(name, cover, a, b, SCALE, sharpen=True)
    place(name, b)

save("room", room, np.ones(room.shape[:2], np.float32), (0, 0, room.shape[1], room.shape[0]), 1, quality=80)
plates["room"] = {"x": -M, "y": -M, "w": int(room.shape[1]), "h": int(room.shape[0])}

for name, rgb, a, x in (("wing-l", wl_rgb, wl_a, EXT + 140 - wl_a.shape[1]), ("wing-r", wr_rgb, wr_a, 1254 + EXT - 140)):
    save(name, rgb, a, (0, 0, a.shape[1], a.shape[0]), WING_S, quality=70)
    plates[name] = {"x": int(x), "y": int(-WING_M), "w": int(a.shape[1]), "h": int(a.shape[0])}
save("desk-front", df_rgb, df_a, (0, 0, df_a.shape[1], df_a.shape[0]), 1, quality=82)
plates["desk-front"] = {"x": int(-DF_M), "y": int(DESK_Y - 4 - TOP), "w": int(df_a.shape[1]), "h": int(df_a.shape[0])}

# The in-studio sign sits where the cover's ON AIR box was.
# Our sign hangs on the wall under the top shelf, clear of the side wing.
plates["sign"] = {"x": 1000 + EXT, "y": 286 - TOP, "w": 176, "h": 70}
# The desk's front edge, in frame px.
plates["deskEdge"] = {"y": DESK_Y - TOP}

json.dump({"frame": {"w": FW, "h": FH}, "scale": SCALE, "plates": plates}, open("src/content/lounge-plates.json", "w"), indent=1)

# A flat composite of every plate, to check the cut-out against the cover.
comp = Image.new("RGBA", (FW, FH), (0, 0, 0, 255))
for n in ("room", "host-2", "wing-r", "host-1", "wing-l", "desk-front", "desk", "mic-2", "mic-1"):
    p = plates[n]
    im = Image.open(f"{OUT}/lounge-{n}.webp").convert("RGBA").resize((p["w"], p["h"]), Image.LANCZOS)
    comp.paste(im, (p["x"], p["y"]), im)
comp.convert("RGB").save(f"{DEBUG}/composite.jpg", quality=90)
print(json.dumps({"frame": [FW, FH], "ext": EXT, "plates": {k: v for k, v in plates.items()}}))
