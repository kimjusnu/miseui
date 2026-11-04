"""Wave 10a: real presses through each new design. Usage: interact-wave10.py [desktop|touch] [name,name]. Closes the browser in every case."""
import json
import os
import sys
import tempfile
import time

from playwright.sync_api import sync_playwright

MODE = sys.argv[1] if len(sys.argv) > 1 else "desktop"
ONLY = sys.argv[2].split(",") if len(sys.argv) > 2 else None
OUT = os.path.join(tempfile.gettempdir(), "miseui-review", "w10i")
os.makedirs(OUT, exist_ok=True)
DEADLINE = time.monotonic() + 400
log, errors = {}, []


def go(page, name, variant):
    page.goto(f"http://localhost:5199/preview/{name}?variant={variant}", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_selector("main > *", timeout=10000)
    page.wait_for_timeout(900)


def shot(page, name):
    page.screenshot(path=os.path.join(OUT, f"{name}-{MODE}.png"), timeout=10000)


def focused(page):
    return page.evaluate("() => { const e = document.activeElement; return e ? (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 40) : null }")


def pricing_single(page):
    go(page, "pricing-table", "single")
    plate = page.locator('[data-variant="single"]')
    before = plate.inner_text()
    page.get_by_role("button", name="Add a seat").click()
    page.wait_for_timeout(300)
    after_seat = plate.inner_text()
    page.get_by_role("switch", name="Bill yearly").click()
    page.wait_for_timeout(400)
    after_month = plate.inner_text()
    shot(page, "single-monthly")
    return {"seat_changed": before != after_seat, "billing_changed": after_seat != after_month, "text": " ".join(after_month.split())[-120:]}


def pricing_comparison(page):
    go(page, "pricing-table", "comparison")
    scroller = page.locator('[data-slot="scroll-shadow-scroller"]').first
    scroller.evaluate("(el) => { el.scrollTop = 200; el.scrollLeft = 120 }")
    page.evaluate("() => window.scrollTo(0, 600)")
    page.wait_for_timeout(400)
    shot(page, "comparison-scrolled")
    head = page.locator("thead th").nth(1).bounding_box()
    return {"head_y": round(head["y"]), "page_wide": page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")}


def login_magic(page):
    go(page, "login-form", "magic")
    page.get_by_label("Email").fill("maya@northgate.studio")
    page.get_by_role("button", name="Email me a link").click()
    page.wait_for_timeout(1800)
    shot(page, "magic-inbox")
    text = " ".join(page.locator('[data-variant="magic"]').inner_text().split())
    return {"text": text[:180], "focus": focused(page)}


def bento_tabs(page):
    go(page, "feature-bento", "tabs")
    tabs = page.get_by_role("tab")
    count = tabs.count()
    tabs.nth(1).click()
    page.wait_for_timeout(500)
    panel = page.get_by_role("tabpanel").first.inner_text()
    shot(page, "tabs-second")
    tabs.nth(1).focus()
    page.keyboard.press("ArrowDown")
    page.wait_for_timeout(300)
    return {"tabs": count, "panel": " ".join(panel.split())[:80], "arrow_selected": tabs.nth(2).get_attribute("aria-selected")}


def signup_conversation(page):
    go(page, "signup-steps", "conversation")
    field = page.locator("main input").first
    first = " ".join(page.locator("main h2").first.inner_text().split())
    field.fill("maya@northgate.studio")
    page.keyboard.press("Enter")
    page.wait_for_timeout(800)
    second = " ".join(page.locator("main h2").first.inner_text().split())
    shot(page, "conversation-second")
    back = page.get_by_role("button", name="Back")
    went_back = None
    if back.count():
        back.first.click()
        page.wait_for_timeout(700)
        went_back = " ".join(page.locator("main h2").first.inner_text().split())
    return {"first": first[:40], "second": second[:40], "back": went_back[:40] if went_back else None, "focus": focused(page)}


def signup_rail(page):
    go(page, "signup-steps", "rail")
    page.locator("main input").first.fill("maya@northgate.studio")
    page.get_by_role("button", name="Continue").click()
    page.wait_for_timeout(800)
    shot(page, "rail-next")
    return {"text": " ".join(page.locator('[data-variant="rail"]').inner_text().split())[:140]}


def empty_checklist(page):
    go(page, "empty-state", "checklist")
    box = page.get_by_role("checkbox").first
    box.click()
    page.wait_for_timeout(500)
    status = page.get_by_role("status").first.inner_text()
    shot(page, "checklist-one")
    return {"status": status, "checked": box.get_attribute("aria-checked")}


def empty_sample(page):
    go(page, "empty-state", "sample")
    page.get_by_role("button", name="Use sample data").click()
    page.wait_for_timeout(1500)
    shot(page, "sample-loaded")
    return {"text": " ".join(page.locator('[data-variant="sample"]').inner_text().split())[:160]}


def dash_table(page):
    go(page, "dashboard-overview", "table")
    filter_box = page.get_by_placeholder("Filter this list")
    filter_box.fill("Quill")
    page.wait_for_timeout(500)
    shot(page, "table-filtered")
    rows = page.locator("main").get_by_text("Pell Street Studio").count()
    filter_box.fill("zzzz")
    page.wait_for_timeout(500)
    shot(page, "table-none")
    empty = " ".join(page.locator('[data-variant="table"]').inner_text().split())[-100:]
    return {"pell_after_filter": rows, "empty_tail": empty}


def dash_analytics(page):
    go(page, "dashboard-overview", "analytics")
    strip = page.get_by_role("group", name="Metric on the chart").get_by_role("button")
    strip.nth(2).click()
    page.wait_for_timeout(700)
    shot(page, "analytics-metric")
    return {"buttons": strip.count(), "pressed": strip.nth(2).get_attribute("aria-pressed")}


def settings_sidebar(page):
    go(page, "settings-page", "sidebar")
    page.get_by_role("button", name="Notifications").first.click() if page.get_by_role("button", name="Notifications").count() else page.get_by_role("link", name="Notifications").first.click()
    page.wait_for_timeout(500)
    shot(page, "sidebar-notifications")
    heading = " ".join(page.locator("main h2, main h3").nth(1).inner_text().split())
    return {"heading": heading[:60], "focus": focused(page)}


def settings_cards(page):
    go(page, "settings-page", "cards")
    page.get_by_label("Display name").fill("Mina O.")
    page.wait_for_timeout(400)
    shot(page, "cards-changed")
    page.get_by_role("button", name="Save Profile").click()
    page.wait_for_timeout(1500)
    shot(page, "cards-saved")
    return {"text": " ".join(page.locator('[data-variant="cards"] section').first.inner_text().split())[-60:]}


def chat_docked(page):
    go(page, "chat-assistant", "docked")
    shot(page, "docked-open")
    work = page.get_by_role("region", name="Your work").bounding_box()
    panel = page.locator('[data-slot="chat-assistant-panel"]').bounding_box()
    page.get_by_role("button", name="Close Tally").click()
    page.wait_for_timeout(500)
    shot(page, "docked-closed")
    after = page.get_by_role("region", name="Your work").bounding_box()
    focus_closed = focused(page)
    page.get_by_role("button", name="Ask Tally").click()
    page.wait_for_timeout(500)
    return {"work": [round(work["x"]), round(work["width"])], "panel": [round(panel["x"]), round(panel["width"])], "work_closed_w": round(after["width"]), "focus_closed": focus_closed, "focus_open": focused(page)}


def chat_popup(page):
    go(page, "chat-assistant", "popup")
    page.keyboard.press("Escape")
    page.wait_for_timeout(700)
    shot(page, "popup-closed")
    launcher = focused(page)
    closed = page.locator('[data-slot="chat-assistant-panel"]').is_visible() if page.locator('[data-slot="chat-assistant-panel"]').count() else False
    buttons = [b.strip()[:24] for b in page.locator("main button").all_inner_texts()][-3:]
    page.locator("main button").last.click()
    page.wait_for_timeout(700)
    shot(page, "popup-open")
    return {"focus_after_escape": launcher, "panel_visible_after_escape": closed, "buttons": buttons, "focus_open": focused(page)}


CASES = {
    "pricing-single": pricing_single,
    "pricing-comparison": pricing_comparison,
    "login-magic": login_magic,
    "bento-tabs": bento_tabs,
    "signup-conversation": signup_conversation,
    "signup-rail": signup_rail,
    "empty-checklist": empty_checklist,
    "empty-sample": empty_sample,
    "dash-table": dash_table,
    "dash-analytics": dash_analytics,
    "settings-sidebar": settings_sidebar,
    "settings-cards": settings_cards,
    "chat-docked": chat_docked,
    "chat-popup": chat_popup,
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        touch = MODE == "touch"
        options = {"viewport": {"width": 375, "height": 812}, "has_touch": True, "is_mobile": True, "device_scale_factor": 2} if touch else {"viewport": {"width": 1280, "height": 800}}
        context = browser.new_context(color_scheme="light", **options)
        context.add_init_script("localStorage.setItem('miseui-theme','light');localStorage.setItem('miseui-palette','mise')")
        for name, case in CASES.items():
            if ONLY and name not in ONLY:
                continue
            if time.monotonic() > DEADLINE:
                log[name] = "skipped: time limit"
                continue
            page = context.new_page()
            page.set_default_timeout(6000)
            page.on("pageerror", lambda e, n=name: errors.append(n + " " + str(e)[:200]))
            page.on("console", lambda m, n=name: errors.append(n + " " + m.text[:200]) if m.type == "error" else None)
            try:
                log[name] = case(page)
            except Exception as error:  # noqa: BLE001 - reported per case, the run continues
                log[name] = "FAILED: " + str(error)[:220]
            finally:
                page.close()
    finally:
        browser.close()
print(json.dumps({"log": log, "errors": errors[:10]}, ensure_ascii=False, indent=0))
