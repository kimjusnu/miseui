"""Recapture block thumbnails. Run `pnpm build && pnpm exec vite preview --port 5199` first; needs Python playwright and Pillow."""
import io
import json
import os
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

DEST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "thumbs")
NAMES = ["empty-state", "chat-assistant", "login-form", "signup-steps", "pricing-table", "dashboard-overview", "settings-page", "landing-hero", "feature-bento", "onboarding-checklist", "verification-code", "docs-layout", "error-page", "site-header", "site-footer", "faq-section", "cta-section", "logo-wall", "stats-section"]
NAMES = sys.argv[1].split(",") if len(sys.argv) > 1 else NAMES
WIDTH = 960
done, errors = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        for mode in ["light", "dark"]:
            ctx = browser.new_context(viewport={"width": 1280, "height": 760}, color_scheme=mode)
            ctx.add_init_script(f"localStorage.setItem('miseui-theme','{mode}');localStorage.setItem('miseui-palette','mise')")
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)[:160]))
            for name in NAMES:
                page.goto(f"http://localhost:5199/preview/{name}", wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(1500)
                raw = page.locator("main > *").first.screenshot(timeout=15000)
                image = Image.open(io.BytesIO(raw)).convert("RGB")
                image = image.resize((WIDTH, int(image.height * WIDTH / image.width)), Image.LANCZOS)
                suffix = "-dark" if mode == "dark" else ""
                image.save(os.path.join(DEST, f"{name}{suffix}.webp"), "WEBP", quality=82, method=6)
                done.append(name + suffix)
            ctx.close()
    finally:
        browser.close()
print(json.dumps({"count": len(done), "errors": errors}))
