"""Name the elements that push a page wider than a phone. Closes the browser in every case."""
import json
import sys

from playwright.sync_api import sync_playwright

JS = """() => {
  const limit = document.documentElement.clientWidth + 1
  const hits = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.right <= limit) continue
    let clipped = false
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX
      if (o !== 'visible') { clipped = true; break }
    }
    if (clipped) continue
    hits.push(el.tagName + ' ' + (el.getAttribute('data-slot') || '') + ' w=' + Math.round(r.width) + ' r=' + Math.round(r.right) + ' ' + String(el.className).slice(0, 70))
  }
  return hits.slice(0, 6)
}"""
out = {}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        page = browser.new_context(viewport={"width": 375, "height": 760}).new_page()
        for name in sys.argv[1].split(","):
            page.goto(f"http://localhost:5199/components/{name}", wait_until="domcontentloaded")
            page.wait_for_timeout(800)
            out[name] = page.evaluate(JS)
    finally:
        browser.close()
print(json.dumps(out, ensure_ascii=False, indent=0))
