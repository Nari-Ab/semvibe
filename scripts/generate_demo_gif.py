import os
from PIL import Image, ImageDraw, ImageFont

# Dimensions
WIDTH = 880
HEIGHT = 560
BG_COLOR = (13, 17, 23)        # GitHub Dark background
TERM_BG = (22, 27, 34)         # Terminal window background
TERM_BORDER = (48, 54, 61)     # Window border
TITLE_BG = (33, 38, 45)        # Title bar background

# Colors
C_WHITE = (240, 246, 252)
C_MUTED = (139, 148, 158)
C_CYAN = (56, 189, 248)
C_GREEN = (46, 160, 67)
C_RED = (248, 81, 73)
C_YELLOW = (227, 179, 65)
C_PROMPT = (88, 166, 255)
C_PURPLE = (188, 140, 255)

# Try loading Menlo or Monaco monospace font
FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
if not os.path.exists(FONT_PATH):
    FONT_PATH = "/System/Library/Fonts/Monaco.ttf"

try:
    font = ImageFont.truetype(FONT_PATH, 15)
    font_bold = ImageFont.truetype(FONT_PATH, 15)
    font_small = ImageFont.truetype(FONT_PATH, 12)
except Exception:
    font = ImageFont.load_default()
    font_bold = font
    font_small = font

def create_base_window():
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Window Card
    pad = 20
    w_x0, w_y0 = pad, pad
    w_x1, w_y1 = WIDTH - pad, HEIGHT - pad
    r = 12

    # Draw rounded terminal window
    draw.rounded_rectangle([w_x0, w_y0, w_x1, w_y1], radius=r, fill=TERM_BG, outline=TERM_BORDER, width=1)

    # Title Bar
    title_h = 36
    draw.rounded_rectangle([w_x0, w_y0, w_x1, w_y0 + title_h + 8], radius=r, fill=TITLE_BG)
    draw.rectangle([w_x0, w_y0 + title_h, w_x1, w_y0 + title_h + 8], fill=TITLE_BG)
    draw.line([w_x0, w_y0 + title_h + 8, w_x1, w_y0 + title_h + 8], fill=TERM_BORDER, width=1)

    # Traffic lights
    btn_y = w_y0 + 16
    draw.ellipse([w_x0 + 16, btn_y - 6, w_x0 + 28, btn_y + 6], fill=(255, 95, 86))
    draw.ellipse([w_x0 + 36, btn_y - 6, w_x0 + 48, btn_y + 6], fill=(255, 189, 46))
    draw.ellipse([w_x0 + 56, btn_y - 6, w_x0 + 68, btn_y + 6], fill=(39, 201, 63))

    # Title text
    draw.text((WIDTH // 2 - 80, btn_y - 7), "semvibe · semantic scan", fill=C_MUTED, font=font_small)

    return img

def render_lines(draw, lines, start_x=45, start_y=75, line_height=21):
    curr_y = start_y
    for item in lines:
        if isinstance(item, str):
            draw.text((start_x, curr_y), item, fill=C_WHITE, font=font)
        elif isinstance(item, list):
            # item is list of (text, color, is_bold)
            curr_x = start_x
            for seg in item:
                txt, col, *rest = seg
                f = font_bold if (rest and rest[0]) else font
                draw.text((curr_x, curr_y), txt, fill=col, font=f)
                bbox = draw.textbbox((curr_x, curr_y), txt, font=f)
                curr_x += (bbox[2] - bbox[0])
        curr_y += line_height

frames = []
durations = []

base_prompt = [
    ("nari@macbook", C_GREEN, True),
    (":", C_MUTED, False),
    ("~/my-nextjs-app", C_PROMPT, True),
    ("$ ", C_MUTED, False)
]

# 1. Prompt with blinking cursor
for _ in range(2):
    img = create_base_window()
    d = ImageDraw.Draw(img)
    render_lines(d, [[*base_prompt, ("_", C_CYAN, False)]])
    frames.append(img)
    durations.append(400)

# 2. Typing `npx semvibe scan .`
cmd = "npx semvibe scan ."
typed = ""
for char in cmd:
    typed += char
    img = create_base_window()
    d = ImageDraw.Draw(img)
    render_lines(d, [[*base_prompt, (typed, C_WHITE, True), ("_", C_CYAN, False)]])
    frames.append(img)
    durations.append(70)

# 3. Enter pressed -> Spinner
spinner_frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
for spin in spinner_frames[:6]:
    img = create_base_window()
    d = ImageDraw.Draw(img)
    lines = [
        [*base_prompt, (cmd, C_WHITE, True)],
        [(f"  {spin} Scanning codebase for architectural drift...", C_CYAN, False)]
    ]
    render_lines(d, lines)
    frames.append(img)
    durations.append(100)

# 4. Result output
result_lines = [
    [*base_prompt, (cmd, C_WHITE, True)],
    [("  ✔ Semantic scan complete.", C_GREEN, False)],
    "",
    [("  ╔══════════════════════════════════════════════════════════╗", C_CYAN, True)],
    [("  ║", C_CYAN, True), ("                 semvibe · semantic scan                  ", C_WHITE, True), ("║", C_CYAN, True)],
    [("  ╚══════════════════════════════════════════════════════════╝", C_CYAN, True)],
    "",
    [("    Scanned:    ", C_MUTED, False), ("428 TypeScript files", C_WHITE, True)],
    [("    Invariants: ", C_MUTED, False), ("6 dominant architectural contracts", C_WHITE, True)],
    "",
    [("    ❌ Found 2 Architectural Violations:", C_RED, True)],
    "",
    [("    #1 ", C_RED, True), ("lib/api/domains/utils.ts:6", C_WHITE, True), (" in validateDomain()", C_MUTED, False)],
    [("       Observed: ", C_MUTED, False), ("error-object", C_RED, True), (" | Expected: ", C_MUTED, False), ("throw", C_GREEN, True)],
    [("       Reason:   ", C_MUTED, False), ("95%+ of API routes throw AppError. Returning error-object violates contract.", C_WHITE, False)],
    [("       Fix:      ", C_MUTED, False), ("throw new AppError('Invalid domain', 422)", C_CYAN, False)],
    "",
    [("    #2 ", C_RED, True), ("auth/signup/utils/prefillAvatar.ts:1", C_WHITE, True)],
    [("       Observed: ", C_MUTED, False), ("node-fetch", C_RED, True), (" | Expected: ", C_MUTED, False), ("native-fetch", C_GREEN, True)],
    [("       Reason:   ", C_MUTED, False), ("Project globally uses native global fetch. Redundant library imported.", C_WHITE, False)],
    [("       Fix:      ", C_MUTED, False), ("Remove node-fetch and use global fetch()", C_CYAN, False)],
]

# Render result build up
img = create_base_window()
d = ImageDraw.Draw(img)
render_lines(d, result_lines)
frames.append(img)
durations.append(4500) # Hold final frame for 4.5 seconds

# Save GIF
os.makedirs("docs/assets", exist_ok=True)
out_path = "docs/assets/demo.gif"
frames[0].save(
    out_path,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    optimize=True
)

print(f"Demo GIF created successfully: {out_path} ({len(frames)} frames, {os.path.getsize(out_path)} bytes)")
