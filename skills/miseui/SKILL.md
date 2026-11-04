---
name: miseui
description: "Use when building React UI and no designer is involved: whole screens (pricing, login, signup, dashboard, settings, chat, landing), complete palettes, shadcn-style components, AI-era states and living effects. Install from the Mise UI registry and follow each piece's psychological rationale."
---

# Mise UI

UI that explains itself. Every component ships with the principle behind its shape and a rule for when not to use it. Keep both when you install or adapt one.

## When to use

- The project is React + Tailwind CSS v4 with a shadcn-style `components.json`
- The screen has an AI step: a wait on a model, streamed text, tool calls, reasoning, voice input
- You need a base kit (button, dialog, select…) whose rationale you can cite in a design review

## Install

1. Theme, once per project: `npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/theme.json` (or `theme-ink`, `theme-cobalt`, `theme-forest`, `theme-ember`; pick one, do not mix colours by hand)
2. Each component: `npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/<name>.json` (dependencies install automatically)
3. Read `references/<name>.md` before using a component for the first time

## Rules

0. Reach for a block first. If a whole screen fits, install it and change the words before composing from parts. Do not restyle it; the spacing and hierarchy are the point.
1. Respect `prefers-reduced-motion`. Every Mise component already does; keep that when you edit one.
2. One `mise` accent per screen. It marks the primary action or live AI activity, never decoration.
3. Name the wait. Any model call over about a second gets a `thinking-indicator` whose label says what is happening.
4. No dark patterns: no fake countdowns, hidden cancel, pre-ticked consent. The **Don't** line in each reference is binding.
5. Keep `data-slot` attributes; tests and styling hooks depend on them.

## Symptom → component

| When you see | Reach for |
|---|---|
| Building a chat screen for an assistant | `chat-assistant` |
| A pricing page where one plan should be the obvious choice | `pricing-table` |
| A login screen | `login-form` |
| A signup flow people abandon halfway | `signup-steps` |
| A dashboard with too many numbers of equal weight | `dashboard-overview` |
| A settings screen | `settings-page` |
| A marketing page needs its first screen | `landing-hero` |
| A marketing page needs its feature section | `feature-bento` |
| A new user sees an empty screen | `empty-state` |
| User waits on a model call longer than about a second | `thinking-indicator` |
| Tokens arrive one by one and should read as typing, not as a frozen block | `streaming-text` |
| An agent ran a tool and the user should be able to trust the result | `tool-call-card` |
| A multi-step plan the user may want to inspect but should not be forced to read | `reasoning-steps` |
| The microphone is live and the user must know it | `voice-glow` |
| The microphone is live and you want bars rather than a glow | `voice-wave` |
| One surface on the screen is where the AI is working right now | `beam-border` |
| The whole app should signal that AI is listening or working | `intelligence-glow` |
| A placeholder like “Thinking…” needs to read as progress without a number | `shimmer-text` |
| Status should be felt in the periphery, without text | `thinking-orb` |
| A premium, physical material cue for one hero control | `liquid-metal` |
| Several status elements merge or split and should feel like one substance | `gooey-morph` |
| Each agent needs a stable, recognisable face | `agent-avatar` |
| An image is being generated and the user should see it arrive | `reveal-image` |
| A sheet or panel the user can drag and flick | `sheet` |
| A surface should arrive like a material, not a fade | `materialize` |
| Content is loading and the final layout is known | `skeleton` |
| One action matters more than the rest of the screen | `button` |
| Too many options in one place | `select` |
| A short list of actions behind one trigger | `dropdown-menu` |
| The user must decide before doing anything else | `dialog` |
| Extra detail that only some users need | `tooltip` |
| Related controls that belong together | `card` |

## Blocks

- **Chat Assistant** (`chat-assistant`): An AI chat that shows the model working, as a full screen, a panel docked beside the work, or a launcher that opens a small window. — Labor illusion · [reference](references/chat-assistant.md)
- **CTA Section** (`cta-section`): One clear thing to do, in three decisions: a plate that ends the page, text beside a piece of the product, or a slim row inside a long page. The copy and the summary are sample content. — Fogg behaviour model · [reference](references/cta-section.md)
- **Dashboard Overview** (`dashboard-overview`): A product dashboard in three decisions: one number first, one large chart first, or the work list first with the numbers as one line. All figures shown are sample data. — Visual hierarchy: one number first · [reference](references/dashboard-overview.md)
- **Docs Layout** (`docs-layout`): A documentation screen from a list of pages: nav, page and table of contents, one column for a short guide, or text beside its code. Collapses on phones. — Information scent · [reference](references/docs-layout.md)
- **Empty State** (`empty-state`): A first screen that gives people somewhere to start: worked examples, the first three things to do, or a ghost of the filled screen with sample data. — Blank page paralysis · [reference](references/empty-state.md)
- **Error Page** (`error-page`): A 404, 500 or offline screen with honest wording and a way out that can work: one sentence, beside places that still work, or a plain readout for developer tools. — Error recovery · [reference](references/error-page.md)
- **FAQ Section** (`faq-section`): Answers before someone has to ask: a short list on one plate, a longer list beside a heading that stays in view, or a filter box with an empty state. The questions are sample content for a sample product. — Progressive disclosure · [reference](references/faq-section.md)
- **Feature Bento** (`feature-bento`): A features section in three forms: an asymmetric grid of mixed cell sizes, alternating picture and text rows, or a list of features driving one large panel. The features shown are sample content. — Aesthetic-usability effect · [reference](references/feature-bento.md)
- **Landing Hero** (`landing-hero`): A marketing hero with one message and two actions, in four layouts: beside a live preview, over a wide product plate, beside two overlapped fragments, or type alone. The call and the people in it are sample content. — Serial position effect · [reference](references/landing-hero.md)
- **Login Form** (`login-form`): A login with labels that stay visible and inline errors, in three forms: beside a calm brand panel with a password you can reveal, one card on a grey ground, or email only with a check-your-inbox screen. — Recognition over recall · [reference](references/login-form.md)
- **Logo Wall** (`logo-wall`): Logos you have permission to show, in three decisions: a quiet row, a plate for each, or a marquee for more than fit. The marks in this preview are dashed placeholders and stand for no real company. — Social proof · [reference](references/logo-wall.md)
- **Onboarding Checklist** (`onboarding-checklist`): First-run setup with a true progress count: a list as its own screen, a slim row above the page, or welcome steps one at a time in a dialog. — Goal gradient · [reference](references/onboarding-checklist.md)
- **Pricing Table** (`pricing-table`): Pricing with an honest yearly anchor, in three forms: three plans with one raised, a side-by-side feature matrix with a sticky plan header, or one plan priced by the seat. — Default effect and anchoring · [reference](references/pricing-table.md)
- **Settings Page** (`settings-page`): A settings screen in three decisions: one page with one save bar, one section at a time beside a side nav, or each group as its own plate with its own Save. The person and plan shown are sample data. — Chunking and forgiveness · [reference](references/settings-page.md)
- **Signup Steps** (`signup-steps`): A sign-up that asks one question at a time, starts with real progress and never ticks consent for anyone, in a card, beside a rail of what is left, or as one large question per screen. — Goal-gradient effect · [reference](references/signup-steps.md)
- **Site Footer** (`site-footer`): The end of every page, in three decisions: a full map of the site, one quiet line, or a newsletter field above the links. The product name and links are sample content. — Information scent · [reference](references/site-footer.md)
- **Site Header** (`site-header`): A marketing site's top navigation with a skip link and a drawer on phones: a plain row of links, panels of grouped links, or pieces floating over the page. — Jakob's law · [reference](references/site-header.md)
- **Stats Section** (`stats-section`): Numbers that make a claim believable, in three decisions: several of equal weight, one to remember above the rest, or each beside what it counts. The figures in this preview are examples and say so. — Concreteness effect · [reference](references/stats-section.md)
- **Verification Code** (`verification-code`): A one-time code screen with a resend countdown, wrong-code and success states, in wording that never reveals whether an address exists: one card, beside what to look for in the inbox, or a row inside your own form. — Error recovery · [reference](references/verification-code.md)

## AI states

- **Reasoning Steps** (`reasoning-steps`): Collapsed timeline of the model's steps; the header names the current one, the body shows them all. — Progressive disclosure · [reference](references/reasoning-steps.md)
- **Streaming Text** (`streaming-text`): Reveals arriving text character by character at reading speed, with a caret that marks where the next word lands. — Perceived latency · [reference](references/streaming-text.md)
- **Thinking Indicator** (`thinking-indicator`): Three breathing dots and a live label that tell the user the model is working, and on what. — Visibility of system status · labor illusion · [reference](references/thinking-indicator.md)
- **Tool Call Card** (`tool-call-card`): Collapsible record of one tool call: name, status, duration, and the exact input and output on demand. — Transparency builds trust · [reference](references/tool-call-card.md)
- **Voice Wave** (`voice-wave`): Bars that rise with the microphone level so the user can see they are being heard, and see when they are not. — Visibility of system status · [reference](references/voice-wave.md)

## Forms

- **Angle Slider** (`angle-slider`): A dial for rotation and other circular values: drags one to one under pointer capture, steps by keyboard, wraps past 360, with a ring, a marked compass, a small knob and a 270 degree gauge. — Natural mapping · [reference](references/angle-slider.md)
- **Button** (`button`): Press target that answers on pointer-down: a 3% dip in 100 ms, so the click feels acknowledged. — Doherty threshold · [reference](references/button.md)
- **Button Group** (`button-group`): Related actions joined under one border, across or down, including a main action with a menu of its alternatives. — Law of common region · [reference](references/button-group.md)
- **Cascader** (`cascader`): Pick from nested options: columns on wide screens, one level at a time on phones, with search, full keyboard, lazy children and the path shown in the trigger. — Hick's law · [reference](references/cascader.md)
- **Checkbox** (`checkbox`): Square toggle that fills and draws its check within 150 ms of the press, and announces the change through aria-checked. — Immediate feedback · [reference](references/checkbox.md)
- **Clipboard** (`clipboard`): One-press copy with a clear result: a lone icon, a code line, a read-only field or a labelled block, and a safe way out when the browser refuses. — Visibility of system status · [reference](references/clipboard.md)
- **Color Picker** (`color-picker`): A saturation square, hue and opacity sliders, typed hex and presets, in four layouts, with a thumb that never lags behind the hand. — Direct manipulation · [reference](references/color-picker.md)
- **Combobox** (`combobox`): A searchable select for long lists, single or multiple, with people rows, section headers, chips and loading built in. — Hick's law · [reference](references/combobox.md)
- **Date Picker** (`date-picker`): A calendar with no date library: single days or ranges, limits, a full keyboard grid and any locale, in four layouts. — Recognition over recall · [reference](references/date-picker.md)
- **Editable** (`editable`): Text that turns into a field in place without moving the page: Enter commits, Escape reverts, leaving commits or reverts by prop, with validation and optional buttons. — Direct manipulation · [reference](references/editable.md)
- **Field** (`field`): Gives any control a label, description, error and required mark, and wires the ids and aria attributes so nobody has to remember them. — Proximity · [reference](references/field.md)
- **File Upload** (`file-upload`): A real drop zone and file input with limits, clear errors and a progress list, and no network code of its own. — Error prevention · [reference](references/file-upload.md)
- **Filter Chips** (`filter-chips`): Filters a list you already have: chips with result counts, an all chip, a clear button and dead ends disabled. — Information scent · [reference](references/filter-chips.md)
- **Icon Button** (`icon-button`): A glyph-only button that cannot be shipped without a name, with four surfaces, a pending state that keeps focus and a 40 px hit area on touch. — Fitts's law · [reference](references/icon-button.md)
- **Image Cropper** (`image-cropper`): Frame a picture by dragging, pinching or scrolling, with keyboard nudges and an aspect lock. The crop it returns can never leave the image. — Direct manipulation · [reference](references/image-cropper.md)
- **Input** (`input`): Single-line text field, 36 px tall to match Button, that moves the invalid state onto its border and ring. — Fitts's law · [reference](references/input.md)
- **Input Group** (`input-group`): One field with text, icons, buttons or a select attached to it, sharing a single border and focus ring, in four layouts. — Law of uniform connectedness · [reference](references/input-group.md)
- **Input OTP** (`input-otp`): One-time code entry drawn as boxes but built on one real input, so SMS autofill, paste, backspace and screen readers all work. — Error prevention · [reference](references/input-otp.md)
- **Label** (`label`): Caption bound to a control: clicking it focuses the field, and it dims when the field is disabled. — Law of proximity · [reference](references/label.md)
- **Listbox** (`listbox`): A list you choose from that stays open, for when seeing every option is the point. — Recognition over recall · [reference](references/listbox.md)
- **Mask Input** (`mask-input`): Formats dates, phone numbers, cards and your own patterns as you type. The caret stays put in the middle and on paste, and deleting across a dash works. — Error prevention · [reference](references/mask-input.md)
- **Number Input** (`number-input`): A field for amounts that clamps to its range, repeats while a button is held and reads formatted text back. — Error prevention · [reference](references/number-input.md)
- **Password Input** (`password-input`): A password field with a reveal button and a caps lock hint, plus a strength meter, a live checklist or a meter on the field edge. — Error prevention · [reference](references/password-input.md)
- **Radio Group** (`radio-group`): One choice from a short list with every option in view, as dots, selectable cards, joined buttons or rows, with arrow keys built in. — Recognition over recall · [reference](references/radio-group.md)
- **Rating** (`rating`): A score picked with a click or the arrow keys, as stars, hearts, a joined number scale or a row of segments, with half steps and a read-only form. — Mental models · [reference](references/rating.md)
- **Search Field** (`search-field`): A search box with a leading icon, clear button, loading state, debounced onSearch and a Mod K hint. Escape clears it. — Doherty threshold · [reference](references/search-field.md)
- **Segmented Control** (`segmented-control`): A short set of mutually exclusive views, always one on, as a thumb in a track, chips, an underline or square icons. — Recognition over recall · [reference](references/segmented-control.md)
- **Select** (`select`): Dropdown for one choice from a list, with a placeholder, groups, a check on the chosen row and full keyboard support. — Default effect · [reference](references/select.md)
- **Signature Pad** (`signature-pad`): Sign with a finger, pen or mouse in smooth strokes, with undo and SVG or PNG export, and a typed name for anyone using a keyboard. — Accessibility as equivalence · [reference](references/signature-pad.md)
- **Slider** (`slider`): Picks a value or a range by feel, as a thin line, a thick volume track, labelled steps or a value bubble, with full keyboard control. — Direct manipulation · [reference](references/slider.md)
- **Switch** (`switch`): Sliding on/off control whose thumb travels 16 px in 150 ms, mirroring the physical toggle it imitates. — Affordance · [reference](references/switch.md)
- **Tags Input** (`tags-input`): A field for many short values, added with Enter or a comma, or pasted as a whole list at once. — Flexibility and efficiency of use · [reference](references/tags-input.md)
- **Textarea** (`textarea`): Multi-line text field that starts at 64 px and grows with its content, so the answer is never hidden behind a scrollbar. — Chunking · [reference](references/textarea.md)
- **Toggle** (`toggle`): A button that stays pressed, for turning a view or format on and off without leaving the page. — Visibility of system status · [reference](references/toggle.md)
- **Toggle Group** (`toggle-group`): A row of buttons that stay pressed, one at a time or several at once: quiet fill, joined outline, wrapping chips or square icons. — Law of common region · [reference](references/toggle-group.md)
- **Toolbar** (`toolbar`): A row of tools that is one tab stop: arrow keys rove inside it, with groups, separators, links and toggles, and it wraps or scrolls instead of breaking the layout. — Fitts's law · [reference](references/toolbar.md)

## Navigation

- **App Shell** (`app-shell`): The frame of an app: navigation, a top bar and a content region, with a skip link and landmarks, where the content scrolls on its own on wide screens. — Jakob's law · [reference](references/app-shell.md)
- **Breadcrumb** (`breadcrumb`): A trail from the root to the current page, with a nav landmark, a current marker and a middle that collapses into a menu. — Information scent · [reference](references/breadcrumb.md)
- **Dock** (`dock`): A row of icon buttons that swell near the pointer and rise without moving the page: a glass bar, bare tiles, a side rail or words under every icon. — Fitts's law · [reference](references/dock.md)
- **Dropdown Menu** (`dropdown-menu`): Compact menu of actions that opens from a button and closes on choice, with arrow-key navigation and a destructive variant. — Hick's law · [reference](references/dropdown-menu.md)
- **Floating Nav** (`floating-nav`): Navigation that floats over the page: a pill with a sliding highlight, a capsule that opens into a panel, a bar that shrinks on scroll or a bottom tab bar. — Visibility of system status · [reference](references/floating-nav.md)
- **Menubar** (`menubar`): The row of menus desktop tools are built on, with sub menus, check and radio items, shortcuts and full arrow key movement across the bar. — Jakob's law · [reference](references/menubar.md)
- **Metro Map** (`metro-map`): Lines and stations from data, for a path that branches and meets again: tap a station, walk with the arrow keys. — Spatial memory · [reference](references/metro-map.md)
- **Navigation Menu** (`navigation-menu`): Site navigation with panels that open from the bar, by pointer or keyboard. — Information scent · [reference](references/navigation-menu.md)
- **Pagination** (`pagination`): Moves through a long list in steady chunks, with the window of pages always the same width so controls never shift. — Spatial memory · [reference](references/pagination.md)
- **Section Index** (`section-index`): A numbered map of the chapters in a long read that fills as you go, as a rail, a sticky strip or a one-line counter. — Goal gradient effect · [reference](references/section-index.md)
- **Sidebar** (`sidebar`): A column of navigation that collapses to icons, nests groups, marks the current page and turns into a drawer on phones. — Spatial memory · [reference](references/sidebar.md)
- **Steps** (`steps`): Shows where someone is in a process, across a line, down a column, as a bar with a count or as numbered rows, with done, current, upcoming and error states. — Goal gradient effect · [reference](references/steps.md)
- **Table of Contents** (`table-of-contents`): Lists the sections of a page, from data or read from the headings, follows the one being read and jumps to any of them with motion that respects reduced motion. — Visibility of system status · [reference](references/table-of-contents.md)
- **Tabs** (`tabs`): Segmented control that swaps one panel for another in place, so related views share a single spot on the screen. — Chunking · [reference](references/tabs.md)

## Overlays

- **Action Bar** (`action-bar`): Appears when items are selected, with the count, the actions and a way to clear, floating over the page, docked to its edge or sitting in the flow. — Progressive disclosure · [reference](references/action-bar.md)
- **Alert Dialog** (`alert-dialog`): A question that has to be answered before anything else, with focus on the safe answer, a typed confirmation for the worst cases and a bottom sheet on phones. — Error prevention · [reference](references/alert-dialog.md)
- **Command** (`command`): A command palette with its own fuzzy search: groups, shortcuts, recent items, an empty state, full combobox and listbox semantics and a Mod+K helper. — Hick's law · [reference](references/command.md)
- **Context Menu** (`context-menu`): The menu that opens where you press: right-click, long press or the Menu key, with sub menus, check and radio items and shortcuts. — Fitts's law · [reference](references/context-menu.md)
- **Dialog** (`dialog`): Modal surface that dims everything else and holds focus until the user answers one question. — Attention funnel · [reference](references/dialog.md)
- **Drawer** (`drawer`): A panel that slides in from an edge for a side task, so the page you came from stays where you left it. — Spatial continuity · [reference](references/drawer.md)
- **Floating Panel** (`floating-panel`): A movable, resizable window that stays on screen, for tools people keep open beside their work. — User control and freedom · [reference](references/floating-panel.md)
- **Hover Card** (`hover-card`): A preview that appears over a link when the pointer rests on it, laid out for free content, a person, a page or a number. — Progressive disclosure · [reference](references/hover-card.md)
- **Hover Preview** (`hover-preview`): A preview that follows the pointer over a list of links, so people can look before they commit to a click. — Information scent · [reference](references/hover-preview.md)
- **Popover** (`popover`): Small floating panel anchored to the control that opened it, for a form or detail that does not need a full dialog. — Spatial memory · [reference](references/popover.md)
- **Station Dialog** (`station-dialog`): A detail dialog that opens from a point on a map or list, knows where it came from and goes back there on close. — Object constancy · [reference](references/station-dialog.md)
- **Tooltip** (`tooltip`): One-line hint that appears on hover or focus with no delay and leaves with the pointer, for detail that does not deserve screen space. — Progressive disclosure · [reference](references/tooltip.md)
- **Tour** (`tour`): A step-by-step product tour with a spotlight cut-out, anchored to a selector or a ref. It manages focus, scrolls targets into view, follows them on resize and skips the ones that are missing. — Von Restorff effect · [reference](references/tour.md)

## Display

- **Accordion** (`accordion`): Stacked rows that open in place, so a long page of answers stays short until someone asks for one. — Progressive disclosure · [reference](references/accordion.md)
- **Aspect Ratio** (`aspect-ratio`): Holds the space for media before it arrives, so the page does not jump, with a mat, an overlaid caption or an empty slot. — Layout stability · [reference](references/aspect-ratio.md)
- **Avatar** (`avatar`): A face or initials that identifies a person at a glance, alone or as an overlapping group with a +N. — Recognition over recall · [reference](references/avatar.md)
- **Badge** (`badge`): Small status chip in five variants; the warm mise variant is reserved for the one item that must stand out. — Von Restorff effect · [reference](references/badge.md)
- **Before After** (`before-after`): Two versions of one thing in the same frame, compared with a divider you drag or a lens that follows the pointer. — Change blindness · [reference](references/before-after.md)
- **Calendar** (`calendar`): A full-size calendar for showing what is on, as a month grid, a week strip, an agenda or a whole year. — Spatial memory · [reference](references/calendar.md)
- **Card** (`card`): Bordered surface with header, content and footer slots that reads as one region before anyone reads the text. — Law of common region · [reference](references/card.md)
- **Card Deck** (`card-deck`): One slide at a time for an argument told in order, moved by swipe, tap, arrow keys or a list of titles. — Chunking · [reference](references/card-deck.md)
- **Carousel** (`carousel`): A row of slides on the browser's own scroll snapping, so swiping feels native and no library is needed. — Direct manipulation · [reference](references/carousel.md)
- **Chart** (`chart`): Bar, line, area and donut charts from one data shape, with axes in round numbers, points you can walk by keyboard and a real table behind them. — Data-ink ratio · [reference](references/chart.md)
- **Code Block** (`code-block`): Readable code without a highlighting library: a small tokenizer for ts, json and bash, line numbers, marked lines, wrap, copy, file tabs and diffs. — Pre-attentive processing · [reference](references/code-block.md)
- **Collapsible** (`collapsible`): One disclosure: a label that opens the detail under it, for the one thing most readers can skip. — Progressive disclosure · [reference](references/collapsible.md)
- **Color Swatch** (`color-swatch`): Shows a colour with its name and value, alone or as a palette, with a label that stays readable on any fill and a checker under transparency. — WCAG contrast · [reference](references/color-swatch.md)
- **Data Table** (`data-table`): Hand it rows and columns and get sorting, a filter box, selection, column visibility, pages and bulk actions, with rows that become cards when the container is narrow. — Recognition over recall · [reference](references/data-table.md)
- **Decision Cards** (`decision-cards`): A record of decisions: the question, what was chosen, what lost and why. — Credibility through trade-offs · [reference](references/decision-cards.md)
- **Description List** (`description-list`): Labels and values on a real dl, as ruled rows, two columns, single lines or tiles, with a slot for a copy button and long values that wrap. — Visual hierarchy · [reference](references/description-list.md)
- **Flow** (`flow`): A process drawn from data, with arrows that can carry words, and no diagram library to load. — Law of continuity · [reference](references/flow.md)
- **Glass Core** (`glass-core`): A glass object for the centre of a hero section, drawn without WebGL and still until you ask it to move. — Aesthetic-usability effect · [reference](references/glass-core.md)
- **Indicator** (`indicator`): A small count, dot, ring or word pinned to the corner of what it describes, gone at zero and spelled out for screen readers. — Law of proximity · [reference](references/indicator.md)
- **Kbd** (`kbd`): Keyboard keys as hairline caps, physical keys, tight chips or plain text, with chords, a platform-aware modifier and a cap that dips on the real key. — Flexibility and efficiency of use · [reference](references/kbd.md)
- **Marquee** (`marquee`): An endless CSS-driven row that stops when someone reaches for it, and turns into a still, scrollable row for people who turned motion off. — Peripheral motion · [reference](references/marquee.md)
- **Motion Reveal** (`motion-reveal`): One wrapper that lets its content arrive when it comes into view, once, as a block or child by child. — Staging · [reference](references/motion-reveal.md)
- **Panel Stack** (`panel-stack`): A story told one panel at a time with a page count and a progress line, in the page or over the whole screen. — Serial position effect · [reference](references/panel-stack.md)
- **Post Row** (`post-row`): One writing entry as a single link: a title, a date that stays on its calendar day and quiet tags. — Scanning patterns · [reference](references/post-row.md)
- **QR Code** (`qr-code`): A QR code encoder written from scratch and drawn as crisp SVG with a quiet zone, in square, dotted, framed and logo forms, always dark on light so it scans. — Reducing interaction cost · [reference](references/qr-code.md)
- **Resizable** (`resizable`): Two panes with a draggable divider, horizontal or vertical, with limits that stretch, a keyboard-operable separator and a double-click reset. — User control and freedom · [reference](references/resizable.md)
- **Ring Gallery** (`ring-gallery`): A small set of items on a 3D ring: drag to spin, click to bring one forward, arrow keys to walk around it. — Von Restorff effect · [reference](references/ring-gallery.md)
- **Role Map** (`role-map`): Who did what on a project: panels, quiet rows or a table of people against areas, with one person in the accent. — Credibility through specifics · [reference](references/role-map.md)
- **Screen Frame** (`screen-frame`): A window, a phone or a plain hairline around a screenshot or live interface. — Framing effect · [reference](references/screen-frame.md)
- **Scroll Area** (`scroll-area`): A scroller with a styled bar that matches the theme, as a hover bar, a thin overlay, edge shadows or a snapping row. — Law of continuity · [reference](references/scroll-area.md)
- **Scroll Shadow** (`scroll-shadow`): A wrapper for any scrolling box that shows edge shadows, fades or hairlines from the real scroll position, so people can see there is more. — Signifiers · [reference](references/scroll-shadow.md)
- **Separator** (`separator`): A rule between groups of content, as a hairline, a dashed break, a labelled divider or a line that fades at both ends. — Law of uniform connectedness · [reference](references/separator.md)
- **Skeleton** (`skeleton`): Pulsing placeholder shaped like the content that is loading, so the wait feels shorter than a spinner. — Perceived performance · [reference](references/skeleton.md)
- **Spoiler** (`spoiler`): Hides text or a block until someone presses to see it, so the reader chooses the moment. Screen readers do not get ahead of everyone else. — User control and freedom · [reference](references/spoiler.md)
- **Stat** (`stat`): One number with its label, change and a small trend line. Colour only appears once you have said which direction is good. — Von Restorff effect · [reference](references/stat.md)
- **Stat Line** (`stat-line`): One line of several figures, before and after included: equal columns, a running sentence or one big number above the rest. — Chunking · [reference](references/stat-line.md)
- **Story Section** (`story-section`): A numbered section of a long read, with the number, heading and text set three ways. — Chunking · [reference](references/story-section.md)
- **Table** (`table`): Real table markup with sortable headers, a sticky head, selection, an empty row and aligned figures, in four densities. — Law of continuity · [reference](references/table.md)
- **Tag** (`tag`): A short label that can also be pressed or removed: soft tint, outline, solid or a status dot, with status tones that never borrow the accent. — Pre-attentive processing · [reference](references/tag.md)
- **Timeline** (`timeline`): Events in order with time, title, detail and a status that keeps its meaning under any accent, down a rail, on two sides, as one-liners or across a row. — Law of continuity · [reference](references/timeline.md)
- **Timer** (`timer`): Counts down to a moment or up from one, with pause and resume. It reads the clock instead of adding ticks, so a sleeping tab cannot make it wrong. — Goal gradient effect · [reference](references/timer.md)
- **Tree View** (`tree-view`): A nested list that opens level by level, with the full keyboard pattern people know from file explorers. — Progressive disclosure · [reference](references/tree-view.md)
- **View Counter** (`view-counter`): A view count from a fetcher you pass, with loading and failure handled and no network code of its own. — Social proof · [reference](references/view-counter.md)

## Feedback

- **Alert** (`alert`): An in-page message with a title, description, action and dismiss, in neutral, success, warning and error tones and four layouts. — Visibility of system status · [reference](references/alert.md)
- **Empty** (`empty`): What a list or a search shows when it has nothing: an icon, a plain reason and the next step, centred, in a dashed slot, on a card or in one row. — Help users recover · [reference](references/empty.md)
- **Loading Overlay** (`loading-overlay`): Covers its parent while work runs, and only its parent. Waits before showing so fast answers never flash, and keeps layout and focus in place. — Doherty threshold · [reference](references/loading-overlay.md)
- **Progress** (`progress`): Shows how far a task has come, as a bar, a hairline, discrete steps or a labelled percent, and admits it when nobody knows yet. — Visibility of system status · [reference](references/progress.md)
- **Progress Circular** (`progress-circular`): Progress in a small square, with the number in the middle and an honest state for when nobody knows how far along it is. — Goal-gradient effect · [reference](references/progress-circular.md)
- **Spinner** (`spinner`): Says work is running when nobody knows how long it will take, in four shapes, with a pulse instead of movement for people who turned motion off. — Visibility of system status · [reference](references/spinner.md)
- **Status** (`status`): A state word with a mark that means something: online, away, busy, offline, error or your own, each with its own shape as well as its own hue. — Redundant coding · [reference](references/status.md)
- **Toast** (`toast`): A brief message about something that just happened, which waits while you read it and leaves without being asked. — Visibility of system status · [reference](references/toast.md)

## Text

- **Count Up** (`count-up`): A number that counts to its value without moving what sits beside it, formatted by Intl, with rolling digits, tiles or a meter line. — Change blindness · [reference](references/count-up.md)
- **Decrypt Text** (`decrypt-text`): Text that starts unreadable and is decoded in place, on first view or behind a real button. — Curiosity gap · [reference](references/decrypt-text.md)
- **Glitch Text** (`glitch-text`): A short stepped burst that ends in clean text, for the one line that should feel like something just happened. — Abrupt onset · [reference](references/glitch-text.md)
- **Gradient Text** (`gradient-text`): A headline painted with a gradient from theme tokens, legible in every palette, with solid fallbacks for high contrast and forced colours. — Von Restorff effect · [reference](references/gradient-text.md)
- **Highlighter Text** (`highlighter-text`): A mark drawn over text that is already readable, line by line, as a marker band, an underline or a hand-drawn stroke or outline. — Signalling · [reference](references/highlighter-text.md)
- **Roll Text** (`roll-text`): A label that rolls to a fresh copy of itself on hover or when its value changes, while assistive tech hears it once. — Feedback through continuity · [reference](references/roll-text.md)
- **Rotating Text** (`rotating-text`): One word in a sentence that takes turns with others, with a slot that springs to each new width and stops whenever someone is reading. — Selective attention · [reference](references/rotating-text.md)
- **Scramble Text** (`scramble-text`): Noise that settles into the real sentence, with every letter holding its final width so nothing on the page moves. — Von Restorff effect · [reference](references/scramble-text.md)
- **Scrub Text** (`scrub-text`): A paragraph that arrives word by word as you scroll, so the pace of reading stays in the reader's hand. — Direct manipulation · [reference](references/scrub-text.md)
- **Shimmer Text** (`shimmer-text`): A band of light passing over a status label, so “Thinking…” reads as in progress without inventing a percentage. — Progress without false precision · [reference](references/shimmer-text.md)
- **Split Text** (`split-text`): A headline that arrives letter by letter or word by word, with the real sentence kept for assistive tech. — Staging · [reference](references/split-text.md)
- **Typewriter Text** (`typewriter-text`): A staged line that types itself with a human rhythm, the whole text laid out from the start so lines never reflow. — Labor illusion · [reference](references/typewriter-text.md)

## Backgrounds

- **Aurora Background** (`aurora-background`): Light with height and direction: curtains from the top, a glow from the bottom edge, a ring behind the centre or one diagonal ribbon, with an optional slow drift. — Directional cue · [reference](references/aurora-background.md)
- **Beams Background** (`beams-background`): Straight lines of light behind a section: a fan, lights on a grid, one slow band or soft shafts, quiet enough to keep the sentence on top first. — Figure and ground · [reference](references/beams-background.md)
- **Dot Background** (`dot-background`): Small marks behind your content: an even dot field, a fading one, plus marks or a halftone growing toward one corner, with an optional colour around the pointer. — Figure and ground · [reference](references/dot-background.md)
- **Grid Background** (`grid-background`): Hairlines behind your content: an even grid, a fading one, a floor receding to a horizon or a few filled cells, with an optional brightening around the pointer. — Figure and ground · [reference](references/grid-background.md)
- **Mesh Background** (`mesh-background`): Large soft colour from the accent and its neighbours, barely tinted to vivid, from one corner or split on a diagonal, with an optional slow drift. — Aesthetic-usability effect · [reference](references/mesh-background.md)
- **Meteors Background** (`meteors-background`): Short streaks crossing a section: thin meteors, faint rain, slow comets or a twinkling sky, placed from a seed and moved with transforms only. — Peripheral vision · [reference](references/meteors-background.md)
- **Noise Background** (`noise-background`): Film grain drawn from an inline SVG with no image files: fine grain, warm paper, grain over a soft accent wash, or sparse flecks. — Aesthetic-usability effect · [reference](references/noise-background.md)
- **Particles Background** (`particles-background`): Points on one canvas behind a section: floating, joined by faint lines, rising, or an even field with a clearing that follows the pointer. — Law of common fate · [reference](references/particles-background.md)
- **Ripple Background** (`ripple-background`): Rings spreading behind a section: still lines, a slow pulse, a turning sonar sweep or several sources, plus a ring from where someone pressed. — Gestalt continuity · [reference](references/ripple-background.md)
- **Spotlight** (`spotlight`): A surface that catches a soft light under the pointer, on its face, on its edge or by uncovering a hidden layer. — Affordance through response · [reference](references/spotlight.md)

## Interactions

- **Animated Beam** (`animated-beam`): A line of light running between two real elements, measured so it follows every reflow: straight, bowed, stepped like a circuit or many sources into one hub. — Gestalt connectedness · [reference](references/animated-beam.md)
- **Card Stack** (`card-stack`): A pile of things with no order: a scattered heap to drag through, a fan that spreads, a swipe to decide on each or notification rows that open into a list. — Hick's law · [reference](references/card-stack.md)
- **Click Spark** (`click-spark`): A wrapper that answers a press with a small burst from that point: lines, falling bits, one soft ring or a little confetti, on one canvas that only draws while something is alive. — Peak-end rule · [reference](references/click-spark.md)
- **Globe** (`globe`): A turning dotted earth on one canvas with no 3D library: land dots, a wire ball, a shaded disc or routes with a light along them, plus markers and drag to spin. — Picture superiority · [reference](references/globe.md)
- **Image Trail** (`image-trail`): Pictures appear along the pointer's path and fade in order, pile up, fan out or slide past, with a still arrangement on touch so the box is never blank. — Direct manipulation · [reference](references/image-trail.md)
- **Lens** (`lens`): A magnifier over any content: a round lens, a lifted loupe, a zoomed panel beside it or a full-width band, with a second copy that focus and assistive tech never reach. — Focus plus context · [reference](references/lens.md)
- **Magnet** (`magnet`): A wrapper that pulls any child toward the pointer from past its own bounds: the whole element, inner layers, a row by distance, or a soft ring that trails. — Affordance · [reference](references/magnet.md)
- **Orbiting Circles** (`orbiting-circles`): Small things travelling around a centre: one orbit, several at different speeds, a tilted ellipse that passes behind or an arch at the foot of a hero. Focus and pointing stop it. — Gestalt common region · [reference](references/orbiting-circles.md)
- **Tilted Card** (`tilted-card`): A showcase card with strong tilt and depth for a picture or a pass: a floating caption, a foil sheen, parts on separate planes or a notched ticket, with text sharp at rest. — Object permanence · [reference](references/tilted-card.md)

## Effects

- **Agent Avatar** (`agent-avatar`): A deterministic SVG face for an agent: the same seed always draws the same overlapping blobs, in theme colours. — Familiarity · identity · [reference](references/agent-avatar.md)
- **Beam Border** (`beam-border`): One beam of light travelling the border of the surface the model is working on, so the eye knows where to wait. — Selective attention · [reference](references/beam-border.md)
- **Gooey Morph** (`gooey-morph`): Status dots that merge into one body and split apart again like a liquid, so the eye tracks one thing changing. — Object permanence · [reference](references/gooey-morph.md)
- **Intelligence Glow** (`intelligence-glow`): A slow light around the screen edge while the assistant listens or thinks, visible from anywhere on the page. — Global status visibility · [reference](references/intelligence-glow.md)
- **Liquid Metal** (`liquid-metal`): A WebGL metal surface behind a button or chip, with reflections that drift so the control reads as a real, premium material. — Material honesty · premium cue · [reference](references/liquid-metal.md)
- **Reveal Image** (`reveal-image`): An image that arrives as it is generated: blur to sharp, coarse mosaic to fine, or a left-to-right wipe, driven by a progress value. — Perceived progress · [reference](references/reveal-image.md)
- **Thinking Orb** (`thinking-orb`): A breathing sphere whose motion says idle, listening, thinking or speaking without a word of text. — Ambient status · labor illusion · [reference](references/thinking-orb.md)
- **Voice Glow** (`voice-glow`): A round glow that swells with the microphone level, so the user sees the assistant is listening and how loudly it hears them. — Visibility of system status · [reference](references/voice-glow.md)

## Transitions

- **Materialize** (`materialize`): A surface that arrives like a material coming into focus: slightly smaller, softer, from its anchor, and leaves the same way. — Spatial consistency · materials · [reference](references/materialize.md)
- **Page Wipe** (`page-wipe`): A full-page wipe between screens: an accent curtain, a slanted sweep or an iris opening from the click. — Peak-end rule · [reference](references/page-wipe.md)
- **Sheet** (`sheet`): Bottom sheet you can grab mid-flight: it tracks the finger 1:1, rubber-bands at the top, and lands where the release velocity was heading. — Interruptibility · momentum projection · [reference](references/sheet.md)
- **useViewTransition** (`use-view-transition`): Five named page-transition presets on the View Transitions API, with a reduced-motion cross-fade and a plain fallback. — Wayfinding · spatial memory · [reference](references/use-view-transition.md)

Source and issues: https://github.com/kimjusnu/miseui
