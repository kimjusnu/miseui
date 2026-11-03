"""Wave 9: pointer, keyboard, drag, frame pacing, idle cost and page stability per interaction. Closes the browser in every case."""
import json
import os
import sys
import tempfile
import time

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5199/components/"
OUT = os.path.join(tempfile.gettempdir(), "miseui-review", "w9i")
os.makedirs(OUT, exist_ok=True)
HIDE = "header:not([data-slot] *){display:none!important}"
ONLY = sys.argv[1].split(",") if len(sys.argv) > 1 else None
DEADLINE = time.monotonic() + 500
log, errors = {}, []
COUNT_FRAMES = "(() => { const raf = window.requestAnimationFrame.bind(window); window.__raf = 0; window.requestAnimationFrame = (cb) => { window.__raf += 1; return raf(cb) } })()"
PACE = """(ms) => new Promise((resolve) => {
  const start = performance.now(); let prev = start, worst = 0, frames = 0, long = 0
  const tick = (now) => { frames += 1; const d = now - prev; worst = Math.max(worst, d); if (d > 34) long += 1; prev = now
    if (now - start < ms) requestAnimationFrame(tick); else resolve({ fps: Math.round(frames / (ms / 1000)), worst: Math.round(worst), long }) }
  requestAnimationFrame(tick)
})"""
RUNNING = """() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('section[aria-label="Demo"]')).length"""
FOCUS = "() => { const e = document.activeElement; return e ? (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 40) : null }"


def go(page, name, settle=1200):
    page.goto(BASE + name, wait_until="domcontentloaded", timeout=15000)
    page.wait_for_selector('section[aria-label="Demo"]', timeout=10000)
    page.add_style_tag(content=HIDE)
    demo = page.locator('section[aria-label="Demo"]').first
    demo.scroll_into_view_if_needed()
    page.wait_for_timeout(settle)
    return demo


def cell(demo, label):
    target = demo.get_by_text(label, exact=True).first.locator("xpath=..")
    target.scroll_into_view_if_needed()
    return target


def shot(target, name):
    target.screenshot(path=os.path.join(OUT, name + ".png"), timeout=10000)


def idle_frames(page, ms=1000):
    before = page.evaluate("() => window.__raf")
    page.wait_for_timeout(ms)
    return page.evaluate("() => window.__raf") - before


def dock(page):
    demo = go(page, "dock")
    target = cell(demo, "magnify effect: point at it, or Tab into it")
    box = target.locator('[data-slot="dock"]').first.bounding_box()
    next_label = demo.get_by_text("magnify effect, side rail", exact=True).first
    before = next_label.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.4, box["y"] + box["height"] * 0.5)
    page.mouse.move(box["x"] + box["width"] * 0.45, box["y"] + box["height"] * 0.5, steps=4)
    page.wait_for_timeout(600)
    shot(target, "dock-magnify")
    log["dock_page_moved"] = next_label.bounding_box()["y"] != before["y"]
    page.mouse.move(5, 5)
    page.wait_for_timeout(500)
    item = target.get_by_role("button").first
    item.focus()
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(500)
    log["dock_focus_after_arrow"] = page.evaluate(FOCUS)
    shot(target, "dock-keyboard")
    rail = cell(demo, "magnify effect, side rail")
    box = rail.locator('[data-slot="dock"]').first.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.3)
    page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.35, steps=3)
    page.wait_for_timeout(500)
    shot(rail, "dock-rail")
    log["dock_rail_buttons"] = rail.get_by_role("button").count()


def floating_nav(page):
    demo = go(page, "floating-nav")
    island = cell(demo, "island: press the capsule, Escape closes")
    island.get_by_role("button").first.click()
    page.wait_for_timeout(600)
    shot(island, "nav-island-open")
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    log["nav_island_focus_back"] = page.evaluate(FOCUS)
    bar = cell(demo, "bar: scroll the box, it shrinks into a pill")
    bar.evaluate("(e) => { const s = [e, ...e.querySelectorAll('*')].find((n) => n.scrollHeight > n.clientHeight + 20 && getComputedStyle(n).overflowY !== 'visible'); if (s) s.scrollTop = 220 }")
    page.wait_for_timeout(800)
    shot(bar, "nav-bar-scrolled")
    hide = cell(demo, "hide effect: scroll down, then back up")
    scroller = "(e, top) => { const s = [e, ...e.querySelectorAll('*')].find((n) => n.scrollHeight > n.clientHeight + 20 && getComputedStyle(n).overflowY !== 'visible'); if (s) s.scrollTop = top }"
    hide.evaluate(scroller, 60)
    page.wait_for_timeout(100)
    hide.evaluate(scroller, 260)
    page.wait_for_timeout(700)
    shot(hide, "nav-hide-down")
    hide.get_by_role("link").first.focus() if hide.get_by_role("link").count() else hide.get_by_role("button").first.focus()
    page.wait_for_timeout(600)
    shot(hide, "nav-hide-focus")
    log["nav_hide_focus_visible"] = page.evaluate(FOCUS)


def lens(page):
    demo = go(page, "lens")
    for label, slug, x, y in [("circle: move over it, or Tab and use the arrows", "circle", 0.5, 0.5), ("square: the loupe sits above the point it reads", "square", 0.75, 0.4), ("panel: the detail sits beside it, below it on a narrow screen", "panel", 0.2, 0.3), ("strip: a band for reading lines", "strip", 0.5, 0.6)]:
        target = cell(demo, label)
        box = target.bounding_box()
        page.mouse.move(box["x"] + box["width"] * x, box["y"] + box["height"] * y)
        page.mouse.move(box["x"] + box["width"] * x + 3, box["y"] + box["height"] * y + 3, steps=3)
        page.wait_for_timeout(400)
        shot(target, f"lens-{slug}")
    target = cell(demo, "circle: move over it, or Tab and use the arrows")
    box = target.bounding_box()
    page.mouse.move(box["x"] + 12, box["y"] + 34)
    page.wait_for_timeout(350)
    shot(target, "lens-corner")
    page.mouse.move(5, 5)
    root = target.locator('[data-slot="lens"]').first
    root.focus()
    for _ in range(6):
        page.keyboard.press("ArrowRight")
    page.wait_for_timeout(300)
    shot(target, "lens-keyboard")
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    shot(target, "lens-escape")
    log["lens_duplicate_focusable"] = page.evaluate("""() => [...document.querySelectorAll('[data-slot="lens"] [aria-hidden="true"]')].filter((n) => !n.closest('[inert]') && n.querySelector('a,button,input')).length""")
    log["lens_dup_ids"] = page.evaluate("""() => { const ids = [...document.querySelectorAll('[id]')].map((n) => n.id); return ids.length - new Set(ids).size }""")


def magnet(page):
    demo = go(page, "magnet")
    target = cell(demo, "pull: bring the pointer near, it reacts from a distance")
    button = target.get_by_role("button").first
    rest = button.bounding_box()
    page.mouse.move(rest["x"] + rest["width"] + 40, rest["y"] + 8)
    page.mouse.move(rest["x"] + rest["width"] + 30, rest["y"] + 6, steps=3)
    page.wait_for_timeout(600)
    moved = button.bounding_box()
    log["magnet_pull_px"] = [round(moved["x"] - rest["x"], 1), round(moved["y"] - rest["y"], 1)]
    shot(target, "magnet-pull")
    field = cell(demo, "field: one group, each item by its own distance")
    box = field.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.55)
    page.mouse.move(box["x"] + box["width"] * 0.52, box["y"] + box["height"] * 0.55, steps=3)
    page.wait_for_timeout(500)
    shot(field, "magnet-field")
    halo = cell(demo, "halo: the price stays put, a ring trails the pointer")
    box = halo.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.62, box["y"] + box["height"] * 0.4)
    page.mouse.move(box["x"] + box["width"] * 0.64, box["y"] + box["height"] * 0.42, steps=3)
    page.wait_for_timeout(600)
    shot(halo, "magnet-halo")
    layers = cell(demo, "layers: the icon and title travel further than the card")
    box = layers.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.66, box["y"] + box["height"] * 0.3)
    page.mouse.move(box["x"] + box["width"] * 0.68, box["y"] + box["height"] * 0.3, steps=3)
    page.wait_for_timeout(600)
    shot(layers, "magnet-layers")
    sticky = cell(demo, "sticky effect: it latches when close and holds on")
    button = sticky.get_by_role("button").first
    rest = button.bounding_box()
    page.mouse.move(rest["x"] + rest["width"] / 2 + 10, rest["y"] + rest["height"] / 2)
    page.wait_for_timeout(500)
    latched = button.bounding_box()
    page.mouse.move(rest["x"] + rest["width"] + 30, rest["y"] + rest["height"] / 2, steps=4)
    page.wait_for_timeout(500)
    held = button.bounding_box()
    log["magnet_sticky_dx"] = [round(latched["x"] - rest["x"], 1), round(held["x"] - rest["x"], 1)]
    page.mouse.move(5, 5)
    page.wait_for_timeout(600)
    frames = idle_frames(page)
    log["magnet_idle_raf"] = frames


def image_trail(page):
    demo = go(page, "image-trail")
    for label, slug in [("trail: pop in, fade in order", "trail"), ("pile: stay until the pointer rests", "pile"), ("fan: seeded angles, like dealt cards", "fan"), ("strip: upright frames along the path", "strip"), ("speed effect: sweep fast, then drift slowly", "speed")]:
        target = cell(demo, label)
        box = target.bounding_box()
        page.mouse.move(box["x"] + 10, box["y"] + box["height"] * 0.7)
        for step in range(1, 13):
            page.mouse.move(box["x"] + box["width"] * step / 13, box["y"] + box["height"] * (0.7 - 0.03 * step), steps=2)
            page.wait_for_timeout(16)
        shot(target, f"trail-{slug}-moving")
        log[f"trail_nodes:{slug}"] = target.evaluate("(e) => e.querySelector('[data-slot=image-trail]')?.querySelectorAll('[aria-hidden] > *').length ?? null")
        page.mouse.move(5, 5)
        page.wait_for_timeout(1600)
        shot(target, f"trail-{slug}-after")
    log["trail_idle_raf"] = idle_frames(page)
    log["trail_running_after"] = page.evaluate(RUNNING)
    target = cell(demo, "trail: pop in, fade in order")
    log["trail_text_copy"] = target.evaluate("(e) => { const n = [...e.querySelectorAll('*')].find((x) => x.textContent === 'Places we walked this year'); const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const t = s.toString(); s.removeAllRanges(); return t }")


def click_spark(page):
    demo = go(page, "click-spark")
    for label, slug, delay in [("spark: press it, or Tab and press Enter", "spark", 110), ("dots", "dots", 200), ("ring: bursts from where you press the row", "ring", 170), ("confetti", "confetti", 260), ("count: more for a big one", "big", 180)]:
        target = cell(demo, label)
        control = target.locator("button, label, [role=checkbox]").first
        box = (control if control.count() else target).bounding_box()
        page.mouse.click(box["x"] + box["width"] * 0.3, box["y"] + box["height"] / 2)
        page.wait_for_timeout(delay)
        shot(target, f"spark-{slug}")
        page.wait_for_timeout(1300)
    log["spark_idle_raf"] = idle_frames(page)
    target = cell(demo, "spark: press it, or Tab and press Enter")
    button = target.get_by_role("button").first
    text = button.inner_text()
    button.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(120)
    shot(target, "spark-keyboard")
    log["spark_click_counts"] = [text, button.inner_text()]
    thanks = cell(demo, "count: fewer pieces for a small moment")
    log["spark_thanks_html"] = thanks.evaluate("(e) => e.lastElementChild.outerHTML.slice(0, 300)")


def tilted_card(page):
    demo = go(page, "tilted-card")
    for label, slug, x, y in [("photo", "photo", 0.1, 0.12), ("glare", "glare", 0.85, 0.2), ("layers", "layers", 0.85, 0.85), ("pass, drag effect: hold it with a finger", "pass", 0.15, 0.85)]:
        target = cell(demo, label)
        root = target.locator('[data-slot="tilted-card"]').first
        box = root.bounding_box()
        page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.5)
        page.mouse.move(box["x"] + box["width"] * x, box["y"] + box["height"] * y, steps=5)
        page.wait_for_timeout(600)
        shot(target, f"tilt-{slug}")
        page.mouse.move(5, 5)
        page.wait_for_timeout(1000)
        log[f"tilt_rest_transform:{slug}"] = root.evaluate("(e) => [e, ...e.querySelectorAll('*')].filter((n) => getComputedStyle(n).transform !== 'none').length")
    log["tilt_idle_raf"] = idle_frames(page)


def card_stack(page):
    demo = go(page, "card-stack")
    pause = demo.get_by_role("button", name="Pause autoplay")
    if pause.count():
        pause.first.click()
    pile = cell(demo, "pile: drag the top away or press Next")
    pile.get_by_role("button", name="Next").click()
    page.wait_for_timeout(700)
    shot(pile, "stack-pile-next")
    root = pile.locator('[data-slot="card-stack"]').first
    box = root.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 60)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] / 2 + 90, box["y"] + 70, steps=6)
    page.wait_for_timeout(120)
    shot(pile, "stack-pile-drag")
    page.mouse.up()
    page.wait_for_timeout(700)
    shot(pile, "stack-pile-after")
    log["stack_pile_focusable_behind"] = root.evaluate("(e) => [...e.querySelectorAll('[inert] a, [inert] button, [aria-hidden=true] a, [aria-hidden=true] button')].filter((n) => !n.closest('[inert]')).length")
    fan = cell(demo, "fan: hover, focus or tap")
    box = fan.locator('[data-slot="card-stack"]').first.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 40)
    page.wait_for_timeout(700)
    shot(fan, "stack-fan-open")
    page.mouse.move(5, 5)
    swipe = cell(demo, "swipe: drag left or right, or use the buttons")
    box = swipe.locator('[data-slot="card-stack"]').first.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 40)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] / 2 + 70, box["y"] + 46, steps=6)
    page.wait_for_timeout(120)
    shot(swipe, "stack-swipe-right")
    page.mouse.up()
    page.wait_for_timeout(700)
    shot(swipe, "stack-swipe-after")
    drafts = demo.get_by_role("group", name="Review drafts")
    for _ in range(3):
        drafts.get_by_role("button", name="Skip").click()
        page.wait_for_timeout(700)
    shot(drafts, "stack-swipe-end")
    log["stack_swipe_end_focus"] = page.evaluate(FOCUS)
    cascade = cell(demo, "cascade: press or focus, and it floats over what follows")
    before = demo.get_by_text("pile, autoplay effect: stops on hover and focus", exact=True).first.bounding_box()
    cascade.get_by_role("button", name="Show all").click()
    page.wait_for_timeout(700)
    shot(cascade, "stack-cascade-open")
    log["stack_cascade_moved_page"] = demo.get_by_text("pile, autoplay effect: stops on hover and focus", exact=True).first.bounding_box()["y"] != before["y"]


def orbit(page):
    demo = go(page, "orbiting-circles")
    log["orbit_pace"] = page.evaluate(PACE, 2000)
    shot(demo, "orbit-t0")
    page.wait_for_timeout(1500)
    shot(cell(demo, "tilted"), "orbit-tilted")
    target = cell(demo, "ring, hover effect: point at, focus or tap an item")
    link = target.locator("a, button").first
    box = link.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.wait_for_timeout(500)
    one = link.bounding_box()
    page.wait_for_timeout(900)
    two = link.bounding_box()
    log["orbit_hover_delta"] = [round(two["x"] - one["x"], 2), round(two["y"] - one["y"], 2)]
    shot(target, "orbit-hover")
    page.mouse.move(5, 5)
    pause = demo.get_by_role("button", name="Pause")
    pause.first.click()
    page.mouse.move(5, 5)
    page.wait_for_timeout(800)
    positions = "() => [...document.querySelectorAll('[data-slot=orbiting-circles-item]')].map((n) => n.style.transform).join('|')"
    a = page.evaluate(positions)
    page.wait_for_timeout(900)
    log["orbit_paused_same"] = a == page.evaluate(positions)
    log["orbit_paused_raf"] = idle_frames(page)


def globe(page):
    demo = go(page, "globe", 2000)
    log["globe_pace"] = page.evaluate(PACE, 3000)
    for label, slug in [("dots", "dots"), ("wire", "wire"), ("solid", "solid"), ("arcs", "arcs")]:
        target = cell(demo, label)
        shot(target, f"globe-{slug}")
    target = cell(demo, "dots, drag effect: flick it, or focus it and press Left and Right")
    canvas = target.locator("canvas").first
    box = canvas.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.5)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] * 0.8, box["y"] + box["height"] * 0.5, steps=8)
    log["globe_drag_pace"] = page.evaluate(PACE, 500)
    page.mouse.up()
    page.wait_for_timeout(300)
    shot(target, "globe-drag")
    pause = demo.get_by_role("button", name="Pause")
    pause.first.click()
    page.wait_for_timeout(3500)
    a = target.screenshot(timeout=10000)
    page.wait_for_timeout(900)
    b = target.screenshot(timeout=10000)
    log["globe_paused_same"] = a == b
    log["globe_paused_raf"] = idle_frames(page)
    target.locator("canvas").first.focus()
    page.keyboard.press("ArrowLeft")
    page.wait_for_timeout(500)
    c = target.screenshot(timeout=10000)
    log["globe_key_turned_while_paused"] = c != b
    demo.get_by_role("button").first.click()
    page.wait_for_timeout(300)
    page.evaluate("() => scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(4000)
    log["globe_offscreen_raf"] = idle_frames(page)


def beam(page):
    demo = go(page, "animated-beam")
    log["beam_pace"] = page.evaluate(PACE, 2500)
    for delay, frame in [(0, "t0"), (800, "t1")]:
        page.wait_for_timeout(delay)
        shot(demo, f"beam-{frame}")
    target = cell(demo, "line, pulse effect: one light per real event")
    target.get_by_role("button", name="Send backup").click() if target.get_by_role("button", name="Send backup").count() else demo.get_by_role("button", name="Send backup").click()
    page.wait_for_timeout(350)
    shot(demo, "beam-pulse")
    log["beam_pulse_text"] = target.locator("xpath=..").inner_text()[-60:]
    page.set_viewport_size({"width": 700, "height": 900})
    page.wait_for_timeout(700)
    shot(demo, "beam-reflow")
    page.set_viewport_size({"width": 1200, "height": 900})
    demo.get_by_role("button", name="Pause").first.click()
    page.wait_for_timeout(300)
    log["beam_paused_running"] = page.evaluate(RUNNING)
    log["beam_paused_raf"] = idle_frames(page)


STEPS = {"dock": dock, "floating-nav": floating_nav, "lens": lens, "magnet": magnet, "image-trail": image_trail, "click-spark": click_spark, "tilted-card": tilted_card, "card-stack": card_stack, "orbiting-circles": orbit, "globe": globe, "animated-beam": beam}


def run(browser, label, step):
    context = browser.new_context(viewport={"width": 1200, "height": 900}, color_scheme="light")
    context.add_init_script("localStorage.setItem('miseui-theme','light');localStorage.setItem('miseui-palette','mise');" + COUNT_FRAMES)
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append(label + " " + str(e)[:200]))
    page.on("console", lambda m: errors.append(label + " " + m.text[:200]) if m.type == "error" else None)
    try:
        step(page)
    except Exception as error:  # noqa: BLE001 - reported per step, the run continues
        log[label] = "FAILED " + str(error)[:400]
    finally:
        context.close()


def touch_drag(cdp, x0, y0, x1, y1, page):
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
    for step in range(1, 9):
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 + (x1 - x0) * step / 8, "y": y0 + (y1 - y0) * step / 8}]})
        page.wait_for_timeout(16)


def touch_end(cdp):
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def overflowed(page):
    return page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")


def centre(box):
    return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2


def touch_pass(browser):
    context = browser.new_context(viewport={"width": 375, "height": 760}, has_touch=True, is_mobile=True, device_scale_factor=2, color_scheme="light")
    context.add_init_script("localStorage.setItem('miseui-theme','light');localStorage.setItem('miseui-palette','mise');" + COUNT_FRAMES)
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append("touch " + str(e)[:200]))
    cdp = context.new_cdp_session(page)
    try:
        demo = go(page, "tilted-card")
        target = cell(demo, "pass, drag effect: hold it with a finger")
        x, y = centre(target.locator('[data-slot="tilted-card"]').first.bounding_box())
        touch_drag(cdp, x, y, x + 60, y + 4, page)
        page.wait_for_timeout(200)
        shot(target, "touch-tilt")
        log["touch_tilt_overflow"] = overflowed(page)
        touch_end(cdp)

        demo = go(page, "lens")
        target = cell(demo, "press effect: hold to look, a finger can drag it")
        x, y = centre(target.bounding_box())
        scroll_before = page.evaluate("() => scrollY")
        touch_drag(cdp, x, y, x + 50, y - 30, page)
        page.wait_for_timeout(200)
        shot(target, "touch-lens")
        log["touch_lens_scrolled"] = page.evaluate("() => scrollY") != scroll_before
        touch_end(cdp)

        demo = go(page, "dock")
        target = cell(demo, "magnify effect: point at it, or Tab into it")
        button = target.get_by_role("button").nth(1)
        button.tap()
        page.wait_for_timeout(400)
        shot(target, "touch-dock")
        log["touch_dock_transform"] = button.evaluate("(e) => e.closest('[data-slot=dock-item]')?.style.transform || 'none'")
        log["touch_dock_item_px"] = button.bounding_box()["height"]

        demo = go(page, "card-stack")
        target = demo.get_by_role("group", name="Plans")
        target.scroll_into_view_if_needed()
        target.locator('[data-slot="card-stack-card"]').first.tap(force=True)
        page.wait_for_timeout(700)
        shot(target, "touch-fan")
        log["touch_fan_overflow"] = overflowed(page)
        drafts = demo.get_by_role("group", name="Review drafts")
        drafts.scroll_into_view_if_needed()
        x, y = centre(drafts.locator('[data-slot="card-stack-card"]').first.bounding_box())
        touch_drag(cdp, x, y, x + 180, y + 3, page)
        shot(drafts, "touch-swipe")
        touch_end(cdp)
        page.wait_for_timeout(600)
        log["touch_swipe_status"] = drafts.locator('[data-slot="card-stack-status"]').first.inner_text()

        demo = go(page, "orbiting-circles")
        target = cell(demo, "ring, hover effect: point at, focus or tap an item")
        target.locator('[data-slot="orbiting-circles-item"] > *').first.tap(force=True)
        page.wait_for_timeout(500)
        shot(target, "touch-orbit")
        log["touch_orbit_labels"] = target.locator('[data-slot="orbiting-circles-label"]').count()

        demo = go(page, "globe", 1500)
        target = cell(demo, "dots, drag effect: flick it, or focus it and press Left and Right")
        x, y = centre(target.locator("canvas").first.bounding_box())
        scroll_before = page.evaluate("() => scrollY")
        touch_drag(cdp, x, y, x, y - 120, page)
        touch_end(cdp)
        page.wait_for_timeout(500)
        log["touch_globe_page_scrolled_on_vertical_swipe"] = page.evaluate("() => scrollY") != scroll_before
        log["touch_globe_overflow"] = overflowed(page)

        demo = go(page, "click-spark")
        target = cell(demo, "spark: press it, or Tab and press Enter")
        target.get_by_role("button").first.tap()
        page.wait_for_timeout(110)
        shot(target, "touch-spark")
    finally:
        context.close()


def reduced_pass(browser):
    context = browser.new_context(viewport={"width": 1200, "height": 900}, reduced_motion="reduce")
    context.add_init_script(COUNT_FRAMES)
    page = context.new_page()
    try:
        for name in ("orbiting-circles", "globe", "animated-beam", "image-trail", "card-stack"):
            demo = go(page, name, 1000)
            shot(demo, f"reduced-{name}")
            log[f"reduced_running:{name}"] = page.evaluate(RUNNING)
            log[f"reduced_raf:{name}"] = idle_frames(page)
    finally:
        context.close()


def ink_pass(browser):
    for mode in ("light", "dark"):
        context = browser.new_context(viewport={"width": 1200, "height": 900}, color_scheme=mode)
        context.add_init_script(f"localStorage.setItem('miseui-theme','{mode}');localStorage.setItem('miseui-palette','ink')")
        page = context.new_page()
        try:
            for name in ("globe", "orbiting-circles", "animated-beam", "dock"):
                demo = go(page, name, 900)
                shot(demo, f"ink-{mode}-{name}")
        finally:
            context.close()


EXTRA = {"touch": touch_pass, "reduced": reduced_pass, "ink": ink_pass}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        for label, step in STEPS.items():
            if ONLY and label not in ONLY:
                continue
            if time.monotonic() > DEADLINE:
                log[label] = "skipped: time limit"
                continue
            run(browser, label, step)
        for label, step in EXTRA.items():
            if ONLY and label not in ONLY:
                continue
            if time.monotonic() > DEADLINE:
                log[label] = "skipped: time limit"
                continue
            try:
                step(browser)
            except Exception as error:  # noqa: BLE001 - reported per pass, the run continues
                log[label] = "FAILED " + str(error)[:400]
    finally:
        browser.close()
with open(os.path.join(OUT, "log.json"), "w", encoding="utf-8") as handle:
    json.dump({"log": log, "errors": errors[:20]}, handle, ensure_ascii=False, indent=0)
print(json.dumps({"log": log, "errors": errors[:20]}, ensure_ascii=False))
