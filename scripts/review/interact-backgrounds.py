"""Wave 8: frames over time for moving backgrounds, pointer and press effects, pause, frame pacing, phone. Closes the browser in every case."""
import json
import os
import tempfile
import time

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5199/components/"
OUT = os.path.join(tempfile.gettempdir(), "miseui-review", "w8i")
os.makedirs(OUT, exist_ok=True)
HIDE = "header:not([data-slot] *){display:none!important}"
NAMES = "grid-background,dot-background,noise-background,mesh-background,aurora-background,beams-background,meteors-background,particles-background,ripple-background".split(",")
MOVING = ["beams-background", "meteors-background", "particles-background", "ripple-background"]
DEADLINE = time.monotonic() + 480
log, errors = {}, []
PACE = """(ms) => new Promise((resolve) => {
  const start = performance.now(); let prev = start, worst = 0, frames = 0, long = 0
  const tick = (now) => {
    frames += 1; const d = now - prev; worst = Math.max(worst, d); if (d > 34) long += 1; prev = now
    if (now - start < ms) requestAnimationFrame(tick); else resolve({ fps: Math.round(frames / (ms / 1000)), worst: Math.round(worst), long })
  }
  requestAnimationFrame(tick)
})"""
RUNNING = """() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('section[aria-label="Demo"]')).length"""


def go(page, name, settle=1500):
    page.goto(BASE + name, wait_until="domcontentloaded", timeout=15000)
    page.wait_for_selector('section[aria-label="Demo"]', timeout=10000)
    page.add_style_tag(content=HIDE)
    demo = page.locator('section[aria-label="Demo"]').first
    demo.scroll_into_view_if_needed()
    page.wait_for_timeout(settle)
    return demo


def cell(demo, label):
    return demo.get_by_text(label, exact=True).first.locator("xpath=..")


def over_time(page):
    for name in MOVING:
        demo = go(page, name)
        for index in range(3):
            demo.screenshot(path=os.path.join(OUT, f"{name}-f{index}.png"), timeout=10000)
            page.wait_for_timeout(1700)
        log[f"pace:{name}"] = page.evaluate(PACE, 3000)
        log[f"running:{name}"] = page.evaluate(RUNNING)
        pause = demo.get_by_role("button", name="Pause")
        pause.click()
        page.wait_for_timeout(300)
        log[f"paused_running:{name}"] = page.evaluate(RUNNING)
        one = demo.screenshot(timeout=10000)
        page.wait_for_timeout(1200)
        two = demo.screenshot(timeout=10000)
        log[f"paused_same_pixels:{name}"] = one == two
        page.evaluate("() => scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(600)
        log[f"offscreen_running:{name}"] = page.evaluate(RUNNING)


def pointers(page):
    for name, label, slug in [("grid-background", "fade, pointer effect", "grid"), ("dot-background", "dots, pointer effect", "dot"), ("dot-background", "halftone, pointer effect", "halftone"), ("particles-background", "field, move the pointer over it", "field"), ("particles-background", "constellation, pointer effect", "constellation")]:
        demo = go(page, name)
        target = cell(demo, label)
        target.scroll_into_view_if_needed()
        box = target.bounding_box()
        page.mouse.move(box["x"] + box["width"] * 0.25, box["y"] + box["height"] * 0.55)
        page.mouse.move(box["x"] + box["width"] * 0.3, box["y"] + box["height"] * 0.6, steps=6)
        page.wait_for_timeout(500)
        target.screenshot(path=os.path.join(OUT, f"pointer-{slug}.png"), timeout=10000)
        log[f"pointer_pace:{slug}"] = page.evaluate(PACE, 1000)
    demo = go(page, "ripple-background")
    target = cell(demo, "rings, press effect: press anywhere in the box")
    target.scroll_into_view_if_needed()
    box = target.bounding_box()
    page.mouse.click(box["x"] + box["width"] * 0.2, box["y"] + box["height"] * 0.6)
    page.wait_for_timeout(280)
    target.screenshot(path=os.path.join(OUT, "press-ring.png"), timeout=10000)
    button = target.get_by_role("button")
    button.evaluate("(e) => { window.__clicked = 0; e.addEventListener('click', () => { window.__clicked += 1 }) }")
    button.click()
    log["press_button_click_reaches"] = page.evaluate("() => window.__clicked")


def phone(browser):
    context = browser.new_context(viewport={"width": 375, "height": 760}, has_touch=True, is_mobile=True, device_scale_factor=2, color_scheme="light")
    context.add_init_script("localStorage.setItem('miseui-theme','light');localStorage.setItem('miseui-palette','mise')")
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append("phone " + str(e)[:200]))
    try:
        for name in NAMES:
            if time.monotonic() > DEADLINE:
                log[f"phone:{name}"] = "skipped: time limit"
                continue
            demo = go(page, name, 300)
            box = demo.bounding_box()
            top = page.evaluate("() => scrollY") + box["y"]
            for step in range(0, int(box["height"]), 500):
                page.evaluate("(y) => scrollTo(0, y)", top + step)
                page.wait_for_timeout(350)
            page.wait_for_timeout(700)
            demo.screenshot(path=os.path.join(OUT, f"phone-{name}.png"), timeout=10000)
            log[f"phone:{name}"] = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
    finally:
        context.close()


def reduced(browser):
    context = browser.new_context(viewport={"width": 1200, "height": 900}, reduced_motion="reduce")
    page = context.new_page()
    try:
        for name in MOVING + ["mesh-background", "aurora-background"]:
            demo = go(page, name, 1200)
            demo.screenshot(path=os.path.join(OUT, f"reduced-{name}.png"), timeout=10000)
            log[f"reduced_running:{name}"] = page.evaluate(RUNNING)
    finally:
        context.close()


def ink(browser):
    for mode in ("light", "dark"):
        context = browser.new_context(viewport={"width": 1200, "height": 900}, color_scheme=mode)
        context.add_init_script(f"localStorage.setItem('miseui-theme','{mode}');localStorage.setItem('miseui-palette','ink')")
        page = context.new_page()
        try:
            for name in ("mesh-background", "aurora-background", "beams-background", "ripple-background", "noise-background"):
                demo = go(page, name, 900)
                demo.screenshot(path=os.path.join(OUT, f"ink-{mode}-{name}.png"), timeout=10000)
        finally:
            context.close()


def desktop(browser, label, step):
    context = browser.new_context(viewport={"width": 1200, "height": 900}, color_scheme="light")
    context.add_init_script("localStorage.setItem('miseui-theme','light');localStorage.setItem('miseui-palette','mise')")
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append(label + " " + str(e)[:200]))
    page.on("console", lambda m: errors.append(label + " " + m.text[:200]) if m.type == "error" else None)
    try:
        step(page)
    except Exception as error:  # noqa: BLE001 - reported per step, the run continues
        log[label] = "FAILED " + str(error)[:300]
    finally:
        context.close()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        desktop(browser, "over_time", over_time)
        desktop(browser, "pointers", pointers)
        for label, run in [("phone", phone), ("reduced", reduced), ("ink", ink)]:
            if time.monotonic() > DEADLINE:
                log[label] = "skipped: time limit"
                continue
            try:
                run(browser)
            except Exception as error:  # noqa: BLE001
                log[label] = "FAILED " + str(error)[:300]
    finally:
        browser.close()
with open(os.path.join(OUT, "log.json"), "w", encoding="utf-8") as handle:
    json.dump({"log": log, "errors": errors[:20]}, handle, ensure_ascii=False, indent=0)
print("done", len(log), len(errors))
