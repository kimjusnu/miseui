"""Capture component demos in an isolated browser. Closes the browser in every case."""
import json
import os
import tempfile
import sys

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5199"
OUT = os.path.join(tempfile.gettempdir(), "miseui-review")
NAMES = sys.argv[1].split(",")
MODE = sys.argv[2] if len(sys.argv) > 2 else "light"
WIDTH = int(sys.argv[3]) if len(sys.argv) > 3 else 1200
os.makedirs(OUT, exist_ok=True)

result = {}
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        context = browser.new_context(viewport={"width": WIDTH, "height": 900}, color_scheme=MODE)
        context.add_init_script(f"localStorage.setItem('miseui-theme','{MODE}');localStorage.setItem('miseui-palette','mise')")
        page = context.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)[:160]))
        for name in NAMES:
            try:
                page.goto(f"{BASE}/components/{name}", wait_until="domcontentloaded", timeout=15000)
                page.wait_for_timeout(1300)
                suffix = "" if MODE == "light" and WIDTH == 1200 else f"-{MODE}-{WIDTH}"
                page.locator('section[aria-label="Demo"]').first.screenshot(path=os.path.join(OUT, f"{name}{suffix}.png"), timeout=10000)
                overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
                result[name] = "overflow" if overflow else "ok"
            except Exception as error:  # noqa: BLE001 - reported per component, the run continues
                result[name] = str(error)[:90]
    finally:
        browser.close()
print(json.dumps({"result": result, "errors": errors}, ensure_ascii=False))
