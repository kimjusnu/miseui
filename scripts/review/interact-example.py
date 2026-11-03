"""Example of driving demos like a person: copy it per wave and change the steps. Closes the browser in every case."""
import json
import os
import tempfile

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5199/components/"
OUT = os.path.join(tempfile.gettempdir(), "miseui-review", "w5i")
os.makedirs(OUT, exist_ok=True)
HIDE = "header:not([data-slot] *){display:none!important}"
log = {}
errors = []


def go(page, name):
    page.goto(BASE + name, wait_until="domcontentloaded")
    page.wait_for_selector('section[aria-label="Demo"]')
    page.wait_for_timeout(900)
    page.add_style_tag(content=HIDE)
    return page.locator('section[aria-label="Demo"]').first


def cell(demo, label):
    return demo.get_by_text(label, exact=False).first.locator("xpath=..")


def snap(page, name):
    page.screenshot(path=os.path.join(OUT, f"{name}.png"))


def chart(page):
    demo = go(page, "chart")
    bar = cell(demo, "bar")
    svg = bar.locator("svg").first
    box = svg.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.5)
    page.wait_for_timeout(250)
    bar.screenshot(path=os.path.join(OUT, "chart-tooltip.png"))
    log["chart_tooltip"] = bar.inner_text()[:120]
    log["chart_axis_clip"] = page.evaluate("""() => {
      const out = []
      for (const t of document.querySelectorAll('section[aria-label="Demo"] svg text')) {
        const s = t.closest('svg').getBoundingClientRect(), r = t.getBoundingClientRect()
        if (r.left < s.left - 0.5 || r.right > s.right + 0.5) out.push(t.textContent + ' ' + Math.round(r.left - s.left))
      }
      return out.slice(0, 8)
    }""")
    log["chart_axis_labels"] = bar.locator("svg text").all_inner_texts()[:12]
    svg.focus()
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(150)
    draw = cell(demo, "draw effect, area")
    draw.scroll_into_view_if_needed()
    page.wait_for_timeout(1300)
    donut = cell(demo, "draw effect, donut")
    page.screenshot(path=os.path.join(OUT, "chart-draw.png"))
    log["chart_draw_paths"] = donut.locator("svg path").count()


def data_table(page):
    demo = go(page, "data-table")
    plain = cell(demo, "plain")
    plain.get_by_role("textbox").fill("seoul")
    page.wait_for_timeout(300)
    log["table_filter"] = plain.get_by_role("row").count()
    plain.get_by_role("textbox").fill("")
    plain.get_by_role("button", name="Customer").click()
    page.wait_for_timeout(200)
    log["table_sort"] = plain.locator("th[aria-sort]").first.get_attribute("aria-sort")
    plain.get_by_role("button", name="Next", exact=False).click()
    page.wait_for_timeout(200)
    log["table_page"] = plain.inner_text()[-40:]
    bulk = cell(demo, "selection with a bulk action")
    bulk.screenshot(path=os.path.join(OUT, "table-bulk.png"))
    columns = plain.get_by_role("button", name="Columns", exact=False)
    log["table_columns_button"] = columns.count()
    if columns.count():
        columns.first.click()
        page.wait_for_timeout(350)
        snap(page, "table-columns")
        page.keyboard.press("Escape")


def sidebar(page):
    demo = go(page, "sidebar")
    plain = cell(demo, "plain")
    width = plain.locator('[data-slot="sidebar"]').first.bounding_box()["width"]
    plain.get_by_role("button", name="Collapse", exact=False).or_(plain.get_by_role("button", name="Toggle", exact=False)).first.click()
    page.wait_for_timeout(600)
    log["sidebar_width"] = [round(width), round(plain.locator('[data-slot="sidebar"]').first.bounding_box()["width"])]
    plain.screenshot(path=os.path.join(OUT, "sidebar-collapsed.png"))
    spring = cell(demo, "spring effect, saved")
    before = spring.inner_text()[-40:]
    page.keyboard.press("Control+b")
    page.wait_for_timeout(500)
    log["sidebar_modb"] = [before, spring.inner_text()[-40:]]
    rail = cell(demo, "rail, icons")
    rail.get_by_role("button").nth(1).hover()
    page.wait_for_timeout(700)
    snap(page, "sidebar-rail-tip")


def shell(page):
    demo = go(page, "app-shell")
    split = cell(demo, "split")
    split.get_by_text("Mina Park").click()
    page.wait_for_timeout(300)
    log["shell_split"] = split.inner_text()[:120]
    narrow = cell(demo, "sidebar, narrow")
    log["shell_buttons"] = narrow.get_by_role("button").evaluate_all("els => els.slice(0, 6).map(e => e.getAttribute('aria-label') || e.textContent.slice(0, 20))")
    log["shell_skip"] = demo.get_by_role("link", name="Skip", exact=False).count()


def cropper(page):
    demo = go(page, "image-cropper")
    spring = cell(demo, "spring effect, drag past")
    area = spring.locator('[role="slider"], [tabindex="0"]').first
    log["crop_role"] = area.get_attribute("role")
    box = area.bounding_box()
    log["crop_before"] = spring.inner_text()[-40:]
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] / 2 + 260, box["y"] + box["height"] / 2, steps=6)
    page.wait_for_timeout(100)
    snap(page, "crop-dragging")
    page.mouse.up()
    page.wait_for_timeout(120)
    snap(page, "crop-spring-mid")
    page.wait_for_timeout(700)
    log["crop_after"] = spring.inner_text()[-40:]
    page.mouse.wheel(0, -300)
    page.wait_for_timeout(300)
    log["crop_after_wheel"] = spring.inner_text()[-40:]
    area.focus()
    page.keyboard.press("ArrowLeft")
    page.wait_for_timeout(200)
    log["crop_after_key"] = spring.inner_text()[-40:]
    free = cell(demo, "free").locator('[data-slot*="corner"], [data-slot*="handle"]')
    log["crop_handles"] = free.count()


def signature(page):
    demo = go(page, "signature-pad")
    plain = cell(demo, "plain")
    pad = plain.locator("canvas, svg").first
    box = pad.bounding_box()
    page.mouse.move(box["x"] + 30, box["y"] + 60)
    page.mouse.down()
    for i, dy in enumerate([20, -20, 30, -10, 15, -25]):
        page.mouse.move(box["x"] + 60 + i * 40, box["y"] + 60 + dy, steps=4)
    page.mouse.up()
    page.wait_for_timeout(200)
    plain.screenshot(path=os.path.join(OUT, "sign-drawn.png"))
    page.mouse.move(box["x"] + 60, box["y"] + 80)
    undo = plain.get_by_role("button", name="Undo")
    log["sign_undo_enabled"] = undo.is_enabled()
    undo.click()
    page.wait_for_timeout(200)
    log["sign_undo_after"] = undo.is_enabled()
    plain.get_by_role("button", name="Type instead").click()
    page.wait_for_timeout(250)
    plain.screenshot(path=os.path.join(OUT, "sign-typed.png"))
    exports = cell(demo, "exports, with")
    exports.get_by_role("button", name="SVG path").click()
    page.wait_for_timeout(250)
    log["sign_svg"] = exports.inner_text()[-80:]
    exports.screenshot(path=os.path.join(OUT, "sign-export.png"))


def context_menu(page):
    demo = go(page, "context-menu")
    cell(demo, "grouped").get_by_text("Design reviews").click(button="right")
    page.wait_for_timeout(350)
    snap(page, "context-open")
    log["context_items"] = page.get_by_role("menu").first.inner_text()[:120].replace("\n", " | ")
    page.keyboard.press("Escape")


def stat_timer(page):
    demo = go(page, "stat")
    count = cell(demo, "count-up effect, once")
    count.scroll_into_view_if_needed()
    page.wait_for_timeout(1500)
    log["stat_counted"] = count.inner_text()[:60]
    demo = go(page, "timer")
    plain = cell(demo, "plain, a focus")
    log["timer_start"] = plain.inner_text()[:30]
    plain.get_by_role("button").first.click()
    page.wait_for_timeout(100)
    a = plain.inner_text()
    page.wait_for_timeout(1400)
    log["timer_paused_same"] = a == plain.inner_text()
    plain.get_by_role("button").first.click()
    page.wait_for_timeout(1300)
    log["timer_resumed_moved"] = a != plain.inner_text()
    plain.get_by_role("button").last.click()
    page.wait_for_timeout(200)
    log["timer_reset"] = plain.inner_text()[:30]


def search_field(page):
    demo = go(page, "search-field")
    plain = cell(demo, "plain, type to search")
    field = plain.locator("input")
    field.fill("north")
    page.wait_for_timeout(100)
    plain.screenshot(path=os.path.join(OUT, "search-pending.png"))
    page.wait_for_timeout(900)
    log["search_result"] = plain.inner_text()[-40:]
    page.keyboard.press("Escape")
    page.wait_for_timeout(150)
    log["search_after_escape"] = field.input_value()
    page.locator("body").click(position={"x": 5, "y": 5})
    page.keyboard.press("Control+k")
    page.wait_for_timeout(150)
    log["search_modk_focus"] = page.evaluate("document.activeElement?.getAttribute('placeholder')")


def spoiler(page):
    demo = go(page, "spoiler")
    cell(demo, "blur effect, clears").get_by_role("button", name="Show the ending").click()
    cell(demo, "block").get_by_role("button").first.click()
    cell(demo, "inline").get_by_role("button").first.click()
    cell(demo, "more").get_by_role("button", name="Show more").first.click()
    page.wait_for_timeout(120)
    snap(page, "spoiler-mid")
    page.wait_for_timeout(600)
    snap(page, "spoiler-end")


def scroll_shadow(page):
    demo = go(page, "scroll-shadow")
    for label in ["shadow", "fade", "line", "both axes"]:
        block = cell(demo, label)
        block.locator("*").evaluate_all("els => { const el = els.find(e => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflowY !== 'visible'); if (el) el.scrollTop = 40; const x = els.find(e => e.scrollWidth > e.clientWidth + 4 && getComputedStyle(e).overflowX !== 'visible'); if (x) x.scrollLeft = 40 }")
    page.wait_for_timeout(350)
    snap(page, "shadow-scrolled")


def loading_overlay(page):
    demo = go(page, "loading-overlay")
    buttons = demo.get_by_role("button", name="Refresh", exact=True)
    log["overlay_buttons"] = buttons.count()
    for index in range(buttons.count()):
        buttons.nth(index).click()
    page.wait_for_timeout(420)
    snap(page, "overlay-on")
    log["overlay_busy"] = demo.locator('[aria-busy="true"]').count()
    page.wait_for_timeout(3000)
    log["overlay_busy_after"] = demo.locator('[aria-busy="true"]').count()
    fast = demo.get_by_role("button", name="Refresh, answers in 120 ms")
    fast.click()
    seen = False
    for _ in range(6):
        page.wait_for_timeout(40)
        seen = seen or cell(demo, "a fast answer").locator('[data-slot*="overlay-layer"], [data-state="visible"]').count() > 0
    log["overlay_fast_seen"] = seen


def cascader(page):
    demo = go(page, "cascader")
    plain = cell(demo, "plain")
    plain.get_by_role("combobox").or_(plain.get_by_role("button")).first.click()
    page.wait_for_timeout(450)
    snap(page, "cascader-open")
    page.keyboard.press("ArrowDown")
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(250)
    page.keyboard.press("ArrowLeft")
    page.wait_for_timeout(200)
    snap(page, "cascader-keys")
    page.keyboard.press("Escape")
    page.wait_for_timeout(250)
    lazy = cell(demo, "lazy children")
    lazy.get_by_role("combobox").or_(lazy.get_by_role("button")).first.click()
    page.wait_for_timeout(350)
    log["cascader_lazy"] = page.get_by_role("tree").first.inner_text()[:60] if page.get_by_role("tree").count() else None
    page.keyboard.press("Escape")


def mask(page):
    demo = go(page, "mask-input")
    plain = cell(demo, "plain, raw and masked")
    field = plain.locator("input").first
    field.click()
    field.press("Control+a")
    field.press("Delete")
    page.keyboard.type("5551234567")
    page.wait_for_timeout(100)
    log["mask_typed"] = field.input_value()
    field.evaluate("el => el.setSelectionRange(2, 2)")
    page.keyboard.type("9")
    log["mask_mid"] = [field.input_value(), field.evaluate("el => el.selectionStart")]
    page.keyboard.press("Backspace")
    log["mask_back"] = [field.input_value(), field.evaluate("el => el.selectionStart")]
    field.evaluate("el => el.setSelectionRange(6, 6)")
    page.keyboard.press("Backspace")
    log["mask_literal_delete"] = [field.input_value(), field.evaluate("el => el.selectionStart")]
    log["mask_raw"] = plain.inner_text()[-40:].replace("\n", " ")
    otp = cell(demo, "otp-like")
    boxes = otp.locator("input")
    log["mask_otp_boxes"] = boxes.count()
    boxes.first.click()
    page.keyboard.type("12")
    page.wait_for_timeout(100)
    log["mask_otp_focus_moved"] = page.evaluate("document.activeElement?.getAttribute('aria-label') || document.activeElement?.value")
    otp.screenshot(path=os.path.join(OUT, "mask-otp.png"))


def phone(browser):
    ctx = browser.new_context(viewport={"width": 375, "height": 760}, has_touch=True, is_mobile=True, device_scale_factor=2, locale="en-US")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append("phone " + str(e)[:200]))
    demo = go(page, "sidebar")
    cell(demo, "drawer on phones").get_by_role("button", name="Open the drawer").tap()
    page.wait_for_timeout(600)
    snap(page, "phone-sidebar-drawer")
    log["phone_drawer"] = page.get_by_role("dialog").count()
    demo = go(page, "app-shell")
    cell(demo, "sidebar, narrow").get_by_role("button").first.tap()
    page.wait_for_timeout(600)
    snap(page, "phone-shell-drawer")
    demo = go(page, "cascader")
    step = cell(demo, "slide effect, stepping")
    step.get_by_text("Europe").tap()
    page.wait_for_timeout(100)
    snap(page, "phone-cascader-mid")
    page.wait_for_timeout(500)
    step.scroll_into_view_if_needed()
    snap(page, "phone-cascader")
    demo = go(page, "context-menu")
    target = cell(demo, "plain").get_by_text("Q3 forecast").bounding_box()
    log["phone_context_box"] = round(target["width"])
    demo = go(page, "chart")
    cell(demo, "line").locator("svg").first.tap()
    page.wait_for_timeout(300)
    snap(page, "phone-chart-tap")
    log["phone_chart_clip"] = page.evaluate("""() => {
      const out = []
      for (const t of document.querySelectorAll('section[aria-label="Demo"] svg text')) {
        const s = t.closest('svg').getBoundingClientRect(), r = t.getBoundingClientRect()
        if (r.left < s.left - 0.5 || r.right > s.right + 0.5) out.push(t.textContent + ' ' + Math.round(r.left - s.left))
      }
      return out.slice(0, 8)
    }""")
    demo = go(page, "signature-pad")
    cell(demo, "compact").screenshot(path=os.path.join(OUT, "phone-sign-compact.png"))
    ctx.close()


STEPS = [chart, data_table, sidebar, shell, cropper, signature, context_menu, stat_timer, search_field, spoiler, scroll_shadow, loading_overlay, cascader, mask]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        ctx = browser.new_context(viewport={"width": 1200, "height": 1000}, color_scheme="light", locale="ko-KR")
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)[:200]))
        page.on("console", lambda m: errors.append("console: " + m.text[:200]) if m.type == "error" else None)
        for step in STEPS:
            try:
                step(page)
            except Exception as error:  # noqa: BLE001 - every step is reported, the run continues
                log["FAILED " + step.__name__] = str(error)[:260]
        ctx.close()
        phone(browser)
    finally:
        browser.close()
print(json.dumps({"log": log, "errors": errors}, ensure_ascii=False, indent=0))
