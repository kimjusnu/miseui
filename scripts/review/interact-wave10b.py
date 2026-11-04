"""Wave 10b: real presses through the new blocks. Usage: interact-wave10b.py [desktop|touch] [case,case]. Closes the browser in every case."""
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
DEADLINE = time.monotonic() + 420
log, errors = {}, []
TOUCH = MODE == "touch"


def go(page, name, variant, query=""):
    page.goto(f"http://localhost:5199/preview/{name}?variant={variant}{query}", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_selector("main > *", timeout=10000)
    page.wait_for_timeout(900)


def shot(page, name):
    page.screenshot(path=os.path.join(OUT, f"{name}-{MODE}.png"), timeout=10000)


def focused(page):
    return page.evaluate("() => { const e = document.activeElement; return e ? (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 40) : null }")


def text_of(page, variant, size=170):
    return " ".join(page.locator(f'[data-variant="{variant}"]').first.inner_text().split())[:size]


def press(page, target):
    if TOUCH:
        target.tap()
    else:
        target.click()


def onboarding_panel(page):
    go(page, "onboarding-checklist", "panel")
    before = page.get_by_role("status").first.inner_text() if page.get_by_role("status").count() else None
    box = page.get_by_role("checkbox").nth(1)
    press(page, box)
    page.wait_for_timeout(600)
    shot(page, "ob-panel")
    return {"before": before, "after": page.get_by_role("status").first.inner_text() if page.get_by_role("status").count() else None, "checked": box.get_attribute("aria-checked")}


def onboarding_banner(page):
    go(page, "onboarding-checklist", "banner")
    shot(page, "ob-banner")
    return {"text": text_of(page, "banner")}


def onboarding_dialog(page):
    go(page, "onboarding-checklist", "dialog")
    dialog = page.get_by_role("dialog")
    opened = dialog.count()
    press(page, page.get_by_role("button", name="Start"))
    page.wait_for_timeout(500)
    shot(page, "ob-dialog-step")
    step_text = " ".join(dialog.first.inner_text().split())[:120]
    page.keyboard.press("Escape")
    page.wait_for_timeout(600)
    shot(page, "ob-dialog-closed")
    return {"opened": opened, "step": step_text, "open_after_escape": page.get_by_role("dialog").count(), "focus": focused(page)}


def verify_card(page):
    go(page, "verification-code", "card")
    otp = page.locator("main input").first
    otp.click()
    page.keyboard.type("111111")
    page.wait_for_timeout(1400)
    shot(page, "vc-wrong")
    wrong = text_of(page, "card")
    alert = page.get_by_role("alert").count()
    otp.click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Backspace")
    page.keyboard.type("246810")
    page.wait_for_timeout(1600)
    shot(page, "vc-right")
    return {"alert": alert, "wrong": wrong[-90:], "right": text_of(page, "card", 120), "focus": focused(page)}


def verify_split(page):
    go(page, "verification-code", "split")
    shot(page, "vc-split")
    return {"email_breaks": page.evaluate("() => { const h = document.querySelector('main h1, main h2'); return h ? getComputedStyle(h).overflowWrap + ' h=' + Math.round(h.getBoundingClientRect().height) + ' w=' + Math.round(h.getBoundingClientRect().width) : null }")}


def docs_sidebar(page):
    go(page, "docs-layout", "sidebar")
    if TOUCH:
        opener = page.get_by_role("button", name="Open sidebar")
        count = opener.count()
        if not count:
            opener = page.locator("main button").first
        press(page, opener)
        page.wait_for_timeout(600)
        shot(page, "docs-drawer")
        press(page, page.get_by_text("Authentication", exact=True).first)
        page.wait_for_timeout(700)
        shot(page, "docs-after-nav")
        return {"opener_named": count, "heading": " ".join(page.locator("main h1, main h2").first.inner_text().split())[:50], "drawer_open": page.get_by_role("dialog").count()}
    press(page, page.get_by_text("Authentication", exact=True).first)
    page.wait_for_timeout(600)
    shot(page, "docs-auth")
    heading = " ".join(page.locator("main h1, main h2").first.inner_text().split())[:50]
    toc = page.get_by_role("link", name="Where to go next")
    return {"heading": heading, "toc_links": toc.count()}


def error_codes(page):
    go(page, "error-page", "split")
    press(page, page.get_by_role("button", name="Try again"))
    page.wait_for_timeout(300)
    busy = text_of(page, "split", 200)
    page.wait_for_timeout(1000)
    shot(page, "err-retry")
    after = text_of(page, "split", 240)
    go(page, "error-page", "terminal", "&code=500")
    shot(page, "err-terminal-500")
    term = text_of(page, "terminal", 180)
    go(page, "error-page", "centered", "&code=offline")
    offline = text_of(page, "centered", 140)
    return {"busy": busy[:60], "after": after[-110:], "terminal500": term, "offline": offline, "alert": page.get_by_role("alert").count()}


def header_mega(page):
    go(page, "site-header", "mega")
    shot(page, "hdr-mega-rest")
    if TOUCH:
        press(page, page.get_by_role("button", name="Open menu"))
        page.wait_for_timeout(700)
        shot(page, "hdr-drawer")
        opened = page.get_by_role("dialog").count()
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        return {"drawer": opened, "focus": focused(page)}
    triggers = page.get_by_role("navigation").first.get_by_role("button")
    label = triggers.first.inner_text()
    triggers.first.click()
    page.wait_for_timeout(700)
    shot(page, "hdr-mega-open")
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    return {"trigger": label, "focus": focused(page)}


def header_skip(page):
    go(page, "site-header", "bar")
    page.keyboard.press("Tab")
    page.wait_for_timeout(300)
    shot(page, "hdr-skip")
    first = focused(page)
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    return {"first_tab": first, "after_enter": page.evaluate("() => document.activeElement.tagName + ' ' + (document.activeElement.id || '')")}


def header_scroll(page):
    go(page, "site-header", "floating")
    page.evaluate("() => window.scrollTo(0, 500)")
    page.wait_for_timeout(700)
    shot(page, "hdr-floating-scrolled")
    if TOUCH:
        return {"scrolled": page.evaluate("() => Math.round(scrollY)")}
    press(page, page.get_by_role("link", name="Pricing").first)
    page.wait_for_timeout(500)
    return {"scrolled": page.evaluate("() => Math.round(scrollY)"), "current": page.locator('[aria-current="page"]').count()}


def footer_signup(page):
    go(page, "site-footer", "signup")
    box = page.get_by_role("textbox").first
    box.fill("not-an-email")
    press(page, page.get_by_role("button", name="Subscribe"))
    page.wait_for_timeout(500)
    shot(page, "ft-invalid")
    invalid = box.get_attribute("aria-invalid")
    box.fill("maya@northgate.studio")
    press(page, page.get_by_role("button", name="Subscribe"))
    page.wait_for_timeout(1300)
    shot(page, "ft-done")
    return {"invalid": invalid, "done": text_of(page, "signup", 110), "focus": focused(page)}


def faq_search(page):
    go(page, "faq-section", "search")
    box = page.get_by_role("searchbox").first if page.get_by_role("searchbox").count() else page.locator("main input").first
    box.fill("cancel")
    page.wait_for_timeout(500)
    filtered = text_of(page, "search", 140)
    box.fill("zzzz")
    page.wait_for_timeout(500)
    shot(page, "faq-none")
    empty = text_of(page, "search", 190)
    return {"filtered": filtered[60:], "empty": empty[60:]}


def faq_keyboard(page):
    go(page, "faq-section", "split")
    trigger = page.get_by_role("button", name="Who can read a summary?")
    trigger.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(500)
    return {"expanded": trigger.get_attribute("aria-expanded"), "arrow": (page.keyboard.press("ArrowDown"), focused(page))[1]}


def logos(page):
    go(page, "logo-wall", "marquee")
    pause = page.get_by_role("button", name="Pause logos")
    running = page.evaluate("() => document.getAnimations().filter((a) => a.playState === 'running').length")
    press(page, pause)
    page.wait_for_timeout(400)
    after = page.evaluate("() => document.getAnimations().filter((a) => a.playState === 'running').length")
    shot(page, "logo-paused")
    return {"running_before": running, "running_after": after, "button": page.get_by_role("button", name="Play logos").count(), "listed": page.get_by_role("listitem").count()}


def stats(page):
    go(page, "stats-section", "plate")
    page.wait_for_timeout(1800)
    return {"text": text_of(page, "plate", 150), "selection": page.evaluate("""() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('[data-variant="plate"]')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const t = s.toString().replace(/\\s+/g, ' ').slice(0, 130); s.removeAllRanges(); return t }""")}


CASES = {f.__name__: f for f in [onboarding_panel, onboarding_banner, onboarding_dialog, verify_card, verify_split, docs_sidebar, error_codes, header_mega, header_skip, header_scroll, footer_signup, faq_search, faq_keyboard, logos, stats]}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        options = {"viewport": {"width": 375, "height": 812}, "has_touch": True, "is_mobile": True, "device_scale_factor": 2} if TOUCH else {"viewport": {"width": 1280, "height": 800}}
        context = browser.new_context(color_scheme="light", **options)
        context.add_init_script("localStorage.setItem('miseui-theme','light');localStorage.setItem('miseui-palette','mise')")
        for name, case in CASES.items():
            if (ONLY and name not in ONLY) or (TOUCH and name == "header_skip"):
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
                log[name] = "FAILED: " + str(error)[:260]
            finally:
                page.close()
    finally:
        browser.close()
print(json.dumps({"log": log, "errors": errors[:10]}, ensure_ascii=False))
