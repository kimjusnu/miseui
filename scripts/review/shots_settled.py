"""Wave 7 captures: end state and mid-effect frames per demo. Usage: w7_shots.py light|dark width [palette]"""
import json
import os
import sys
import tempfile
import time

from playwright.sync_api import sync_playwright

NAMES = "scramble-text,decrypt-text,typewriter-text,glitch-text,count-up,rotating-text,gradient-text,highlighter-text".split(",")
MODE = sys.argv[1]
WIDTH = int(sys.argv[2])
PALETTE = sys.argv[3] if len(sys.argv) > 3 else "mise"
ONLY = sys.argv[4].split(",") if len(sys.argv) > 4 else NAMES
OUT = os.path.join(tempfile.gettempdir(), "miseui-review")
os.makedirs(OUT, exist_ok=True)
DEADLINE = time.monotonic() + 240
OVERFLOW = """() => {
  const limit = document.documentElement.clientWidth + 1
  const hits = []
  for (const el of document.querySelectorAll('section[aria-label="Demo"] *')) {
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
result, errors = {}, []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        touch = WIDTH < 600
        context = browser.new_context(viewport={"width": WIDTH, "height": 900}, color_scheme=MODE, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
        context.add_init_script(f"localStorage.setItem('miseui-theme','{MODE}');localStorage.setItem('miseui-palette','{PALETTE}')")
        page = context.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)[:200]))
        page.on("console", lambda m: errors.append(m.text[:200]) if m.type == "error" else None)
        for name in ONLY:
            if time.monotonic() > DEADLINE:
                result[name] = "skipped: time limit"
                continue
            try:
                page.goto(f"http://localhost:5199/components/{name}", wait_until="domcontentloaded", timeout=15000)
                page.wait_for_selector('section[aria-label="Demo"]', timeout=10000)
                page.add_style_tag(content="header:not([data-slot] *){display:none!important}")
                demo = page.locator('section[aria-label="Demo"]').first
                demo.scroll_into_view_if_needed()
                page.wait_for_timeout(4000)
                tag = f"{name}-{MODE}-{WIDTH}" + ("" if PALETTE == "mise" else f"-{PALETTE}")
                demo.screenshot(path=os.path.join(OUT, f"{tag}.png"), timeout=10000)
                result[name] = page.evaluate(OVERFLOW)
                replay = demo.get_by_role("button", name="Play again")
                if replay.count() and WIDTH >= 600:
                    for delay in (80, 300):
                        replay.first.click()
                        page.wait_for_timeout(delay)
                        demo.screenshot(path=os.path.join(OUT, f"{tag}-t{delay}.png"), timeout=10000)
                        page.wait_for_timeout(2500)
                else:
                    result[name] = {**result[name], "replay": replay.count()}
            except Exception as error:  # noqa: BLE001 - reported per component, the run continues
                result[name] = str(error)[:140]
    finally:
        browser.close()
print(json.dumps({"result": result, "errors": errors[:10]}, ensure_ascii=False))
