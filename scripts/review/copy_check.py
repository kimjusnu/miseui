"""What a person gets when they select a finished effect and copy it, and what reduced motion shows from the first frame."""
import json
import os
import tempfile

from playwright.sync_api import sync_playwright

NAMES = "scramble-text,decrypt-text,typewriter-text,glitch-text,count-up,rotating-text,gradient-text,highlighter-text,split-text".split(",")
OUT = os.path.join(tempfile.gettempdir(), "miseui-review", "w7i")
SELECT = """(slot) => [...document.querySelectorAll(`section[aria-label="Demo"] [data-slot="${slot}"]`)].map((root) => {
  const range = document.createRange()
  range.selectNodeContents(root)
  const selection = getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
  const copied = selection.toString()
  selection.removeAllRanges()
  return (root.dataset.variant || '') + ': ' + JSON.stringify(copied.slice(0, 90))
})"""
log = {}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        page = browser.new_context(viewport={"width": 1200, "height": 2000}).new_page()
        for name in NAMES:
            page.goto(f"http://localhost:5199/components/{name}", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_selector(f'[data-slot="{name}"]', timeout=10000)
            page.wait_for_timeout(3000)
            log[name] = page.evaluate(SELECT, name)
        reduced = browser.new_context(viewport={"width": 1200, "height": 2000}, reduced_motion="reduce").new_page()
        for name in NAMES[:-1]:
            reduced.goto(f"http://localhost:5199/components/{name}", wait_until="domcontentloaded", timeout=15000)
            reduced.wait_for_selector(f'[data-slot="{name}"]', timeout=10000)
            demo = reduced.locator('section[aria-label="Demo"]').first
            first = demo.inner_text()
            reduced.wait_for_timeout(2500)
            log[f"reduced:{name}"] = {"stable": first == demo.inner_text()}
            demo.screenshot(path=os.path.join(OUT, f"reduced-{name}.png"), timeout=8000)
    finally:
        browser.close()
with open(os.path.join(OUT, "copy.json"), "w", encoding="utf-8") as handle:
    json.dump(log, handle, ensure_ascii=False, indent=0)
print("done")
