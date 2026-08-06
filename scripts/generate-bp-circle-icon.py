#!/usr/bin/env python3
"""Build square BP circle launcher icons from the circular BP mark."""

from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / ".cursor/projects/Users-fazalurrehman-Documents-flow/assets/Screenshot_2026-08-06_at_6.07.48_AM-2faf16aa-16e2-4d88-8470-ef1cc735f976.png"
FALLBACK_SOURCE = ROOT / "public/bpexch-login-logo.jpg"

OUTPUTS = {
    ROOT / "android/app/src/main/res/drawable-nodpi/bpexch_launcher.png": 512,
    ROOT / "public/bp-circle-icon.png": 512,
}


def load_source() -> Image.Image:
    path = SOURCE if SOURCE.exists() else FALLBACK_SOURCE
    return Image.open(path).convert("RGBA")


def circle_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    px = image.load()
    width, height = image.size
    xs: list[int] = []
    ys: list[int] = []

    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            if is_logo_pixel(r, g, b, a):
                xs.append(x)
                ys.append(y)

    if not xs:
        return 0, 0, width, height

    pad = 2
    left = max(min(xs) - pad, 0)
    top = max(min(ys) - pad, 0)
    right = min(max(xs) + pad, width)
    bottom = min(max(ys) + pad, height)
    return left, top, right, bottom


def is_logo_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 16:
        return False
    # Turquoise circle fill from the BP mark.
    if g > 165 and b > 165 and r >= 90:
        return True
    # Dark BP lettering.
    if r < 90 and g < 110 and b < 130:
        return True
    return False


def make_circle_icon(image: Image.Image, size: int) -> Image.Image:
    px = image.convert("RGBA").load()
    width, height = image.size
    xs: list[int] = []
    ys: list[int] = []

    for y in range(height):
        for x in range(width):
            if is_logo_pixel(*px[x, y]):
                xs.append(x)
                ys.append(y)

    if not xs:
        left, top, right, bottom = circle_bounds(image)
    else:
        pad = 1
        left = max(min(xs) - pad, 0)
        top = max(min(ys) - pad, 0)
        right = min(max(xs) + pad, width)
        bottom = min(max(ys) + pad, height)

    cropped = image.crop((left, top, right, bottom))
    cpx = cropped.convert("RGBA").load()
    cw, ch = cropped.size
    side = max(cw, ch)
    cx = cy = side / 2
    radius = side / 2

    # Average circle color for a clean fill behind the letters.
    rs = gs = bs = count = 0
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = cpx[x, y]
            if g > 165 and b > 165 and r >= 90 and a > 16:
                rs += r
                gs += g
                bs += b
                count += 1
    fill = (rs // count, gs // count, bs // count, 255) if count else (110, 220, 210, 255)

    icon = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ipx = icon.load()
    ox = (side - cw) // 2
    oy = (side - ch) // 2

    for y in range(side):
        for x in range(side):
            if math.hypot(x - cx, y - cy) > radius:
                continue
            sx = x - ox
            sy = y - oy
            if 0 <= sx < cw and 0 <= sy < ch:
                r, g, b, a = cpx[sx, sy]
                if is_logo_pixel(r, g, b, a):
                    ipx[x, y] = (r, g, b, a if a else 255)
                    continue
            ipx[x, y] = fill

    return icon.resize((size, size), Image.Resampling.LANCZOS)


def average_circle_color(image: Image.Image) -> str:
    left, top, right, bottom = circle_bounds(image)
    cropped = image.crop((left, top, right, bottom)).convert("RGBA")
    px = cropped.load()
    width, height = cropped.size
    cx, cy = width / 2, height / 2
    radius = min(width, height) / 2
    rs = gs = bs = count = 0

    for y in range(height):
        for x in range(width):
            if math.hypot(x - cx, y - cy) > radius * 0.92:
                continue
            r, g, b, a = px[x, y]
            if a < 32:
                continue
            rs += r
            gs += g
            bs += b
            count += 1

    if not count:
        return "#57E7DB"

    return "#{:02X}{:02X}{:02X}".format(rs // count, gs // count, bs // count)


def main() -> None:
    source = load_source()
    bg_color = average_circle_color(source)

    for path, size in OUTPUTS.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        icon = make_circle_icon(source, size)
        if path.suffix.lower() in {".jpg", ".jpeg"}:
            icon.convert("RGB").save(path, quality=95)
        else:
            icon.save(path)

    bg_xml = ROOT / "android/app/src/main/res/values/ic_launcher_background.xml"
    bg_xml.write_text(
        "\n".join(
            [
                '<?xml version="1.0" encoding="utf-8"?>',
                "<resources>",
                f'    <color name="ic_launcher_background">{bg_color}</color>',
                "</resources>",
                "",
            ]
        ),
        encoding="utf-8",
    )

    print(f"Generated {len(OUTPUTS)} icons using background {bg_color}")


if __name__ == "__main__":
    main()
