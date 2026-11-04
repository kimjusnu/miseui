"""The block page as a visitor sees it: design switcher, phone-width frame, and the full-screen link. Usage: framed_preview.py. Closes the browser in every case."""
import json
import os
import tempfile

from playwright.sync_api import sync_playwright

OUT = os.path.join(tempfile.gettempdir(), "miseui-review", "w10f")
os.makedirs(OUT, exist_ok=True)
CASES = [("landing-hero", "overlap"), ("pricing-table", "comparison"), ("chat-assistant", "docked"), ("chat-assistant", "popup"), ("settings-page", "sidebar"), ("dashboard-overview", "table")]
log, errors = {}, []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        context = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        context.add_init_script("localStorage.setItem('miseui-theme','light');localStorage.setItem('miseui-palette','mise')")
        for name, variant in CASES:
            page = context.new_page()
            page.set_default_timeout(6000)
            page.on("pageerror", lambda e: errors.append(str(e)[:200]))
            page.on("console", lambda m: errors.append(m.text[:200]) if m.type == "error" else None)
            try:
                page.goto(f"http://localhost:5199/components/{name}", wait_until="domcontentloaded", timeout=15000)
                preview = page.get_by_role("region", name="Preview") if page.get_by_role("region", name="Preview").count() else page.locator('section[aria-label="Preview"]')
                preview.wait_for()
                group = page.get_by_role("group", name="Design")
                labels = group.get_by_role("button").all_inner_texts()
                group.get_by_role("button", name=variant, exact=True).click()
                page.wait_for_timeout(1200)
                root = preview.locator("[data-variant]").first
                link = page.get_by_role("link", name="Open full screen in a new tab").get_attribute("href")
                preview.screenshot(path=os.path.join(OUT, f"{name}-{variant}-wide.png"))
                page.get_by_role("button", name="Phone width").click()
                page.wait_for_timeout(1200)
                preview.screenshot(path=os.path.join(OUT, f"{name}-{variant}-phone.png"))
                log[f"{name}:{variant}"] = {"designs": labels, "root": root.get_attribute("data-variant"), "link": link, "wide_page": page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")}
            except Exception as error:  # noqa: BLE001 - reported per case, the run continues
                log[f"{name}:{variant}"] = "FAILED: " + str(error)[:200]
            finally:
                page.close()
    finally:
        browser.close()
print(json.dumps({"log": log, "errors": errors[:10]}, ensure_ascii=False))
