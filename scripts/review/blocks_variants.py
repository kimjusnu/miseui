"""Every design of every block at /preview/<name>?variant=<v>. Usage: blocks_variants.py light|dark width [palette] [name,name|name:variant]
Viewport-height shots: a block's first screen is what a person judges first. Full-page shots go next to them with a -full suffix."""
import json
import os
import sys
import tempfile
import time

from playwright.sync_api import sync_playwright

BLOCKS = {
    "landing-hero": ["split", "centered", "overlap", "minimal"],
    "pricing-table": ["cards", "comparison", "single"],
    "login-form": ["split", "centered", "magic"],
    "feature-bento": ["bento", "rows", "tabs"],
    "signup-steps": ["card", "rail", "conversation"],
    "empty-state": ["centered", "checklist", "sample"],
    "dashboard-overview": ["overview", "analytics", "table"],
    "settings-page": ["sections", "sidebar", "cards"],
    "chat-assistant": ["full", "docked", "popup"],
    "onboarding-checklist": ["panel", "banner", "dialog"],
    "verification-code": ["card", "split", "inline"],
    "docs-layout": ["sidebar", "centered", "reference"],
    "error-page": ["centered", "split", "terminal"],
    "site-header": ["bar", "mega", "floating"],
    "site-footer": ["columns", "minimal", "signup"],
    "faq-section": ["accordion", "split", "search"],
    "cta-section": ["plate", "split", "banner"],
    "logo-wall": ["row", "grid", "marquee"],
    "stats-section": ["row", "plate", "split"],
}
MODE = sys.argv[1]
WIDTH = int(sys.argv[2])
PALETTE = sys.argv[3] if len(sys.argv) > 3 else "mise"
ONLY = sys.argv[4].split(",") if len(sys.argv) > 4 else None
OUT = os.path.join(tempfile.gettempdir(), "miseui-review", "w10")
os.makedirs(OUT, exist_ok=True)
DEADLINE = time.monotonic() + 400
OVERFLOW = """() => {
  const limit = document.documentElement.clientWidth + 1
  const hits = []
  for (const el of document.querySelectorAll('main *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.right <= limit) continue
    let clipped = false
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible') { clipped = true; break }
    }
    if (!clipped) hits.push(el.tagName + ' ' + (el.getAttribute('data-slot') || '') + ' r=' + Math.round(r.right))
  }
  return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth, hits: hits.slice(0, 4) }
}"""
SMALL_TARGETS = """() => {
  const seen = []
  for (const el of document.querySelectorAll('main button, main a[href], main input:not([type=hidden]), main [role=switch], main [role=tab]')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0) continue
    if (r.height < 40 || (el.tagName === 'BUTTON' && r.width < 40)) seen.push((el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height))
  }
  return seen.slice(0, 6)
}"""


def targets():
    if not ONLY:
        return [(name, variant) for name, variants in BLOCKS.items() for variant in variants]
    picked = []
    for item in ONLY:
        name, _, variant = item.partition(":")
        picked += [(name, variant)] if variant else [(name, v) for v in BLOCKS[name]]
    return picked


result, errors = {}, []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        touch = WIDTH < 600
        context = browser.new_context(viewport={"width": WIDTH, "height": 812 if touch else 800}, color_scheme=MODE, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
        context.add_init_script(f"localStorage.setItem('miseui-theme','{MODE}');localStorage.setItem('miseui-palette','{PALETTE}')")
        for name, variant in targets():
            # A fresh page each time: a full-page capture changes device metrics, and one long-lived page reported 36 px where a fresh one reports 40.
            page = context.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)[:200]))
            page.on("console", lambda m: errors.append(m.text[:200]) if m.type == "error" else None)
            key = f"{name}:{variant}"
            if time.monotonic() > DEADLINE:
                result[key] = "skipped: time limit"
                page.close()
                continue
            try:
                page.goto(f"http://localhost:5199/preview/{name}?variant={variant}", wait_until="domcontentloaded", timeout=15000)
                page.wait_for_selector("main > *", timeout=10000)
                page.wait_for_timeout(1500)
                tag = f"{name}-{variant}-{MODE}-{WIDTH}" + ("" if PALETTE == "mise" else f"-{PALETTE}")
                root = page.locator("main [data-variant]").first
                entry = {"variant": root.get_attribute("data-variant") if root.count() else None, **page.evaluate(OVERFLOW)}
                if touch:
                    entry["small"] = page.evaluate(SMALL_TARGETS)
                    entry["coarse"] = page.evaluate("() => matchMedia('(pointer: coarse)').matches")
                result[key] = entry
                page.screenshot(path=os.path.join(OUT, f"{tag}.png"), timeout=10000)
                page.screenshot(path=os.path.join(OUT, f"{tag}-full.png"), full_page=True, timeout=10000)
            except Exception as error:  # noqa: BLE001 - reported per design, the run continues
                result[key] = str(error)[:140]
            finally:
                page.close()
    finally:
        browser.close()
print(json.dumps({"result": result, "errors": errors[:10]}, ensure_ascii=False))
