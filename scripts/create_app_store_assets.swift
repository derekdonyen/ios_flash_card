import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let screenshotsDir = root.appendingPathComponent("app-store/screenshots")
let publicDir = root.appendingPathComponent("public")
try FileManager.default.createDirectory(at: screenshotsDir, withIntermediateDirectories: true)
try FileManager.default.createDirectory(at: publicDir, withIntermediateDirectories: true)

let canvas = CGSize(width: 1290, height: 2796)
let phone = CGRect(x: 145, y: 610, width: 1000, height: 1940)

struct Palette {
    static let bg = NSColor(calibratedRed: 0.964, green: 0.980, blue: 0.996, alpha: 1)
    static let blue = NSColor(calibratedRed: 0.145, green: 0.388, blue: 0.922, alpha: 1)
    static let deep = NSColor(calibratedRed: 0.067, green: 0.094, blue: 0.153, alpha: 1)
    static let muted = NSColor(calibratedRed: 0.420, green: 0.447, blue: 0.502, alpha: 1)
    static let line = NSColor(calibratedRed: 0.882, green: 0.910, blue: 0.953, alpha: 1)
    static let teal = NSColor(calibratedRed: 0.055, green: 0.647, blue: 0.647, alpha: 1)
    static let amber = NSColor(calibratedRed: 0.961, green: 0.620, blue: 0.043, alpha: 1)
    static let green = NSColor(calibratedRed: 0.133, green: 0.773, blue: 0.369, alpha: 1)
    static let white = NSColor.white
}

func rounded(_ rect: CGRect, radius: CGFloat, fill: NSColor, stroke: NSColor? = nil, lineWidth: CGFloat = 1) {
    let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    fill.setFill()
    path.fill()
    if let stroke {
        stroke.setStroke()
        path.lineWidth = lineWidth
        path.stroke()
    }
}

func text(_ value: String, _ rect: CGRect, size: CGFloat, weight: NSFont.Weight = .regular, color: NSColor = Palette.deep, align: NSTextAlignment = .left, lineHeight: CGFloat? = nil) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = align
    paragraph.lineBreakMode = .byWordWrapping
    if let lineHeight {
        paragraph.minimumLineHeight = lineHeight
        paragraph.maximumLineHeight = lineHeight
    }
    let font = NSFont.systemFont(ofSize: size, weight: weight)
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: color,
        .paragraphStyle: paragraph
    ]
    value.draw(in: rect, withAttributes: attrs)
}

func pill(_ label: String, rect: CGRect, fill: NSColor, color: NSColor = Palette.deep) {
    rounded(rect, radius: 24, fill: fill)
    text(label, rect.insetBy(dx: 12, dy: 13), size: 24, weight: .bold, color: color, align: .center)
}

func drawIcon(in rect: CGRect) {
    let iconPath = root.appendingPathComponent("assets/icon.png").path
    if let image = NSImage(contentsOfFile: iconPath) {
        image.draw(in: rect)
    } else {
        rounded(rect, radius: 38, fill: Palette.blue)
    }
}

func drawPhoneShell() {
    rounded(phone.offsetBy(dx: 0, dy: 14), radius: 86, fill: NSColor(calibratedWhite: 0, alpha: 0.12))
    rounded(phone, radius: 86, fill: Palette.deep)
    rounded(phone.insetBy(dx: 26, dy: 26), radius: 66, fill: NSColor(calibratedRed: 0.980, green: 0.988, blue: 0.996, alpha: 1))
    rounded(CGRect(x: phone.midX - 150, y: phone.minY + 28, width: 300, height: 42), radius: 21, fill: Palette.deep)
}

func inside(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> CGRect {
    CGRect(x: phone.minX + 68 + x, y: phone.minY + 100 + y, width: w, height: h)
}

func drawHeader(title: String, subtitle: String) {
    drawIcon(in: CGRect(x: 96, y: 102, width: 112, height: 112))
    text("記憶卡片", CGRect(x: 230, y: 116, width: 420, height: 46), size: 30, weight: .bold, color: Palette.blue)
    text(title, CGRect(x: 86, y: 245, width: 1120, height: 180), size: 68, weight: .heavy, color: Palette.deep, align: .center, lineHeight: 78)
    text(subtitle, CGRect(x: 150, y: 430, width: 990, height: 90), size: 34, weight: .medium, color: Palette.muted, align: .center, lineHeight: 44)
}

func drawDashboard() {
    drawPhoneShell()
    text("記憶卡片", inside(0, 0, 560, 60), size: 46, weight: .heavy)
    text("今天到期的卡片和你的牌組都在這裡。", inside(0, 72, 700, 48), size: 25, color: Palette.muted)
    rounded(inside(740, 2, 84, 84), radius: 24, fill: NSColor(calibratedRed: 0.933, green: 0.953, blue: 0.980, alpha: 1))
    text("📊", inside(758, 18, 50, 50), size: 34)

    let metrics = [("今日待複習", "12"), ("今日已完成", "8"), ("連續天數", "5")]
    for (index, item) in metrics.enumerated() {
        let r = inside(CGFloat(index) * 282, 170, 262, 180)
        rounded(r, radius: 22, fill: Palette.white, stroke: Palette.line)
        text(item.1, r.insetBy(dx: 24, dy: 24), size: 54, weight: .heavy)
        text(item.0, CGRect(x: r.minX + 24, y: r.minY + 112, width: 210, height: 36), size: 23, color: Palette.muted)
    }
    text("卡片牌組", inside(0, 418, 300, 45), size: 34, weight: .heavy)
    pill("新增", rect: inside(690, 404, 136, 60), fill: Palette.blue, color: .white)
    let decks = [("商務英文片語", "英文 · 42 張卡片", "6"), ("日常會話", "片語 · 28 張卡片", "3"), ("面試題", "自訂 · 16 張卡片", "3")]
    for (index, deck) in decks.enumerated() {
        let r = inside(0, 510 + CGFloat(index) * 190, 826, 154)
        rounded(r, radius: 24, fill: Palette.white, stroke: Palette.line)
        text(deck.0, CGRect(x: r.minX + 30, y: r.minY + 28, width: 520, height: 42), size: 31, weight: .heavy)
        text(deck.1, CGRect(x: r.minX + 30, y: r.minY + 86, width: 460, height: 34), size: 22, color: Palette.muted)
        rounded(CGRect(x: r.maxX - 150, y: r.minY + 32, width: 112, height: 90), radius: 20, fill: NSColor(calibratedRed: 0.910, green: 0.961, blue: 1, alpha: 1))
        text(deck.2, CGRect(x: r.maxX - 150, y: r.minY + 40, width: 112, height: 42), size: 35, weight: .heavy, color: Palette.blue, align: .center)
        text("待複習", CGRect(x: r.maxX - 150, y: r.minY + 86, width: 112, height: 26), size: 18, weight: .bold, color: Palette.blue, align: .center)
    }
}

func drawDeckDetail() {
    drawPhoneShell()
    text("商務英文片語", inside(0, 0, 600, 60), size: 44, weight: .heavy)
    text("英文 · 42 張卡片 · 6 張到期", inside(0, 70, 610, 44), size: 25, color: Palette.muted)
    pill("開始複習", rect: inside(0, 162, 396, 76), fill: Palette.blue, color: .white)
    pill("新增卡片", rect: inside(430, 162, 396, 76), fill: Palette.white)
    let cards = [("安排會議時間", "schedule a meeting"), ("確認截止日期", "confirm the deadline"), ("跟進進度", "follow up on progress"), ("延後討論", "postpone the discussion")]
    for (index, card) in cards.enumerated() {
        let r = inside(0, 310 + CGFloat(index) * 220, 826, 174)
        rounded(r, radius: 24, fill: Palette.white, stroke: Palette.line)
        text(card.0, CGRect(x: r.minX + 30, y: r.minY + 28, width: 560, height: 42), size: 31, weight: .heavy)
        text(card.1, CGRect(x: r.minX + 30, y: r.minY + 84, width: 600, height: 42), size: 27, color: Palette.muted)
        text(index < 2 ? "現在可複習" : "已排入未來複習", CGRect(x: r.minX + 30, y: r.minY + 132, width: 320, height: 28), size: 20, color: index < 2 ? Palette.blue : Palette.muted)
        text("🗑", CGRect(x: r.maxX - 78, y: r.minY + 56, width: 46, height: 46), size: 30)
    }
}

func drawNewCard() {
    drawPhoneShell()
    text("新增卡片", inside(0, 0, 520, 60), size: 46, weight: .heavy)
    text("商務英文片語", inside(0, 72, 560, 44), size: 25, color: Palette.muted)
    text("提示面", inside(0, 162, 180, 38), size: 26, weight: .bold, color: Palette.muted)
    rounded(inside(0, 218, 826, 250), radius: 22, fill: Palette.white, stroke: Palette.line)
    text("請在會議後寄出摘要", inside(28, 248, 760, 60), size: 34, weight: .bold)
    text("答案面", inside(0, 520, 180, 38), size: 26, weight: .bold, color: Palette.muted)
    rounded(inside(0, 576, 826, 250), radius: 22, fill: Palette.white, stroke: Palette.line)
    text("send a recap after the meeting", inside(28, 606, 760, 96), size: 34, weight: .bold)
    text("卡片類型", inside(0, 882, 180, 38), size: 26, weight: .bold, color: Palette.muted)
    let types = ["英文", "中文", "片語", "自訂"]
    for (index, item) in types.enumerated() {
        let active = index == 0
        pill(item, rect: inside(CGFloat(index) * 210, 938, 190, 72), fill: active ? Palette.deep : Palette.white, color: active ? .white : Palette.deep)
    }
    rounded(inside(0, 1080, 826, 78), radius: 22, fill: NSColor(calibratedRed: 0.910, green: 0.961, blue: 1, alpha: 1))
    text("☑  答案面啟用英文發音", inside(30, 1102, 620, 40), size: 28, weight: .bold, color: Palette.blue)
    pill("儲存卡片", rect: inside(0, 1240, 826, 82), fill: Palette.blue, color: .white)
}

func drawReview() {
    drawPhoneShell()
    text("複習", inside(0, 0, 280, 60), size: 46, weight: .heavy)
    text("商務英文片語 · 今日到期", inside(0, 72, 620, 44), size: 25, color: Palette.muted)
    let tabs = ["提示先", "答案先", "隨機"]
    for (index, item) in tabs.enumerated() {
        pill(item, rect: inside(CGFloat(index) * 276, 150, 256, 70), fill: index == 0 ? Palette.deep : Palette.white, color: index == 0 ? .white : Palette.deep)
    }
    rounded(inside(0, 304, 826, 600), radius: 34, fill: Palette.white, stroke: NSColor(calibratedRed: 0.760, green: 0.855, blue: 1, alpha: 1), lineWidth: 3)
    text("點一下翻面", inside(0, 360, 826, 40), size: 24, weight: .heavy, color: Palette.blue, align: .center)
    text("請在會議後寄出摘要", inside(80, 500, 666, 140), size: 54, weight: .heavy, align: .center, lineHeight: 66)
    text("目前顯示提示面", inside(0, 710, 826, 36), size: 23, weight: .bold, color: Palette.muted, align: .center)
    text("1 / 12", inside(0, 948, 160, 42), size: 28, weight: .heavy, color: Palette.muted)
    pill("🔊  發音", rect: inside(650, 930, 176, 66), fill: NSColor(calibratedRed: 0.910, green: 0.961, blue: 1, alpha: 1), color: Palette.blue)
    let actions = [("稍後", Palette.line), ("1日", NSColor(calibratedRed: 0.859, green: 0.918, blue: 1, alpha: 1)), ("3日", NSColor(calibratedRed: 0.859, green: 0.918, blue: 1, alpha: 1)), ("7日", NSColor(calibratedRed: 0.863, green: 0.988, blue: 0.906, alpha: 1)), ("1月", NSColor(calibratedRed: 0.863, green: 0.988, blue: 0.906, alpha: 1))]
    for (index, item) in actions.enumerated() {
        let row = index / 3
        let col = index % 3
        pill(item.0, rect: inside(CGFloat(col) * 276, 1060 + CGFloat(row) * 92, 256, 74), fill: item.1)
    }
}

func drawStats() {
    drawPhoneShell()
    text("每日統計", inside(0, 0, 360, 60), size: 46, weight: .heavy)
    text("追蹤今天的記憶狀況。", inside(0, 72, 620, 44), size: 25, color: Palette.muted)
    let metrics = [("今天複習", "36"), ("今天新增", "9"), ("連續天數", "12"), ("總卡片", "128"), ("待複習", "14"), ("牌組數", "6")]
    for (index, item) in metrics.enumerated() {
        let row = index / 3
        let col = index % 3
        let r = inside(CGFloat(col) * 282, 160 + CGFloat(row) * 194, 262, 170)
        rounded(r, radius: 22, fill: Palette.white, stroke: Palette.line)
        text(item.1, r.insetBy(dx: 24, dy: 24), size: 50, weight: .heavy)
        text(item.0, CGRect(x: r.minX + 24, y: r.minY + 104, width: 210, height: 34), size: 22, color: Palette.muted)
    }
    text("今天的按鈕分布", inside(0, 590, 420, 48), size: 34, weight: .heavy)
    let bars: [(String, CGFloat, NSColor)] = [("稍後", 0.18, Palette.amber), ("1日", 0.34, Palette.blue), ("3日", 0.28, Palette.teal), ("7日", 0.14, Palette.green), ("1月", 0.06, Palette.deep)]
    for (index, bar) in bars.enumerated() {
        let r = inside(0, 680 + CGFloat(index) * 154, 826, 112)
        rounded(r, radius: 22, fill: Palette.white, stroke: Palette.line)
        text(bar.0, CGRect(x: r.minX + 28, y: r.minY + 22, width: 180, height: 34), size: 26, weight: .heavy)
        text("\(Int(bar.1 * 36))", CGRect(x: r.maxX - 98, y: r.minY + 22, width: 60, height: 34), size: 25, weight: .heavy, align: .right)
        rounded(CGRect(x: r.minX + 28, y: r.minY + 72, width: 770, height: 16), radius: 8, fill: Palette.line)
        rounded(CGRect(x: r.minX + 28, y: r.minY + 72, width: 770 * bar.1, height: 16), radius: 8, fill: bar.2)
    }
}

func drawScreenshot(file: String, title: String, subtitle: String, content: () -> Void) {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(canvas.width), pixelsHigh: Int(canvas.height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSColor.white.setFill()
    CGRect(origin: .zero, size: canvas).fill()
    let gradient = NSGradient(colors: [Palette.bg, NSColor(calibratedRed: 0.925, green: 0.965, blue: 1, alpha: 1)])!
    gradient.draw(in: CGRect(origin: .zero, size: canvas), angle: 270)
    drawHeader(title: title, subtitle: subtitle)
    content()
    NSGraphicsContext.restoreGraphicsState()
    let data = rep.representation(using: .png, properties: [:])!
    try! data.write(to: screenshotsDir.appendingPathComponent(file))
}

drawScreenshot(file: "01-home-dashboard.png", title: "每天該複習什麼，一眼看到", subtitle: "待複習、已完成與連續天數都整理在首頁。") { drawDashboard() }
drawScreenshot(file: "02-custom-decks.png", title: "單字、片語、面試題都能分組", subtitle: "依自己的學習目標建立不同卡片牌組。") { drawDeckDetail() }
drawScreenshot(file: "03-create-card.png", title: "正反面自由輸入，英文可發音", subtitle: "提示、答案、類型與發音開關都由你決定。") { drawNewCard() }
drawScreenshot(file: "04-review-flow.png", title: "翻卡後安排下一次複習", subtitle: "稍後、1日、3日、7日或1月，照熟悉度排程。") { drawReview() }
drawScreenshot(file: "05-daily-stats.png", title: "每日記憶進度清楚累積", subtitle: "追蹤複習量、新增卡片與按鈕分布。") { drawStats() }

let privacyHtml = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Memory Cards Privacy Policy</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color: #111827; background: #f8fafc; line-height: 1.6; }
    main { max-width: 760px; margin: 0 auto; padding: 56px 22px; }
    h1 { font-size: 36px; line-height: 1.15; margin: 0 0 12px; }
    h2 { font-size: 22px; margin-top: 34px; }
    p { font-size: 17px; color: #374151; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>Memory Cards Privacy Policy</h1>
      <p><strong>Effective Date:</strong> 2026-05-27</p>
      <p>Memory Cards is designed as a local flashcard learning app.</p>
      <h2>Data Collection</h2>
      <p>The app does not collect, transmit, sell, or share personal data.</p>
      <p>User-created decks, cards, review schedules, and review statistics are stored locally on the user's device.</p>
      <h2>Third-Party Services</h2>
      <p>The app does not use advertising networks, analytics services, or third-party tracking services.</p>
      <h2>Speech</h2>
      <p>The app may use the device's built-in text-to-speech functionality to pronounce English words or phrases.</p>
      <h2>Data Storage</h2>
      <p>All learning content is stored locally on the device. Deleting the app may delete the locally stored data.</p>
      <h2>Contact</h2>
      <p>For support or privacy questions, contact the developer through the support channel listed on the App Store product page.</p>
    </div>
  </main>
</body>
</html>
"""

let supportHtml = """
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>記憶卡片 Support</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color: #111827; background: #f8fafc; line-height: 1.6; }
    main { max-width: 760px; margin: 0 auto; padding: 56px 22px; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; }
    h1 { font-size: 36px; line-height: 1.15; margin: 0 0 12px; }
    p, li { font-size: 17px; color: #374151; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>記憶卡片 Support</h1>
      <p>記憶卡片是一款本地儲存的 flashcard 學習工具。</p>
      <p>如果需要支援，請在 App Store 產品頁面列出的開發者聯絡方式與我們聯繫。</p>
      <h2>常見問題</h2>
      <ul>
        <li>資料儲存在裝置本機。</li>
        <li>刪除 App 可能會移除本機卡片資料。</li>
        <li>英文發音使用裝置內建文字轉語音功能。</li>
      </ul>
    </div>
  </main>
</body>
</html>
"""

try privacyHtml.write(to: publicDir.appendingPathComponent("privacy.html"), atomically: true, encoding: .utf8)
try supportHtml.write(to: publicDir.appendingPathComponent("support.html"), atomically: true, encoding: .utf8)

print("Created screenshots in \(screenshotsDir.path)")
print("Created public pages in \(publicDir.path)")
