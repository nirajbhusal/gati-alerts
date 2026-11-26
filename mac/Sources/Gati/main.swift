// Gati for macOS.
// A menu-bar item that lists the active official alerts Gati relays, and a window that shows the Gati site.
// It reads one public file, data/alerts.json, from the Gati site every 15 minutes. Nothing about the reader is sent.
// Gati relays agencies' notices. It does not issue warnings.

import AppKit
import WebKit

let siteURL = URL(string: "https://gatialerts.com/")!
let siteHost = "gatialerts.com"
let refreshSeconds: TimeInterval = 15 * 60

// MARK: - Data

struct AlertInfo: Decodable {
    let headline: String?
    let instruction: String?
}

struct GatiAlert: Decodable {
    let identifier: String
    let trust: String?
    let severity: String?
    let hazard: String?
    let sent: String?
    let expires: String?
    let expired: Bool?
    let supersededBy: String?
    let districts: [String]?
    let info: [String: AlertInfo]?
}

struct AlertFeed: Decodable {
    let alerts: [GatiAlert]
    let generated: String?
}

func parseDate(_ s: String?) -> Date? {
    guard let s = s else { return nil }
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    if let d = f.date(from: s) { return d }
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f.date(from: s)
}

let severityRank: [String: Int] = ["Extreme": 4, "Severe": 3, "Moderate": 2, "Minor": 1]

func severityColor(_ s: String?) -> NSColor {
    switch s ?? "" {
    case "Extreme": return NSColor(srgbRed: 0.557, green: 0.106, blue: 0.078, alpha: 1)
    case "Severe": return NSColor(srgbRed: 0.851, green: 0.188, blue: 0.145, alpha: 1)
    case "Moderate": return NSColor(srgbRed: 0.949, green: 0.549, blue: 0.118, alpha: 1)
    case "Minor": return NSColor(srgbRed: 0.949, green: 0.788, blue: 0.298, alpha: 1)
    default: return NSColor(srgbRed: 0.561, green: 0.608, blue: 0.702, alpha: 1)
    }
}

func dotImage(_ color: NSColor) -> NSImage {
    let size = NSSize(width: 12, height: 12)
    let image = NSImage(size: size, flipped: false) { rect in
        color.setFill()
        NSBezierPath(ovalIn: rect.insetBy(dx: 1.5, dy: 1.5)).fill()
        return true
    }
    return image
}

// MARK: - App

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, NSWindowDelegate {
    var statusItem: NSStatusItem!
    var window: NSWindow?
    var webView: WKWebView?
    var timer: Timer?
    var active: [GatiAlert] = []
    var lastChecked: Date?
    var loadFailed = false

    var lang: String {
        get {
            if let v = UserDefaults.standard.string(forKey: "lang") { return v }
            let pref = Locale.preferredLanguages.first ?? "en"
            return pref.hasPrefix("ne") ? "ne" : "en"
        }
        set { UserDefaults.standard.set(newValue, forKey: "lang") }
    }

    func t(_ ne: String, _ en: String) -> String { return lang == "ne" ? ne : en }

    // MARK: Launch

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMainMenu()
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        statusItem.button?.title = "ग"
        statusItem.button?.toolTip = "Gati"
        rebuildStatusMenu()
        openMainWindow(nil)
        refresh(nil)
        let tm = Timer(timeInterval: refreshSeconds, repeats: true) { [weak self] _ in self?.refresh(nil) }
        RunLoop.main.add(tm, forMode: .common)
        timer = tm
        showFirstRunNoticeIfNeeded()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { return false }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag { openMainWindow(nil) }
        return true
    }

    func showFirstRunNoticeIfNeeded() {
        if UserDefaults.standard.bool(forKey: "noticeShown") { return }
        UserDefaults.standard.set(true, forKey: "noticeShown")
        let a = NSAlert()
        a.messageText = t("गति आधिकारिक सूचना फैलाउँछ", "Gati relays official notices")
        a.informativeText = t(
            "गतिले आफैँ चेतावनी जारी गर्दैन। यो निराज भुसालको स्वतन्त्र परियोजना हो, सरकारी एप होइन। आपत्कालमा १००, १०१, १०२ वा १२३४ मा फोन गर्नुहोस्।",
            "Gati does not issue warnings of its own. It is an independent project by Niraj Bhusal, not a government app. In an emergency call 100, 101, 102 or 1234.")
        a.addButton(withTitle: t("ठिक छ", "OK"))
        a.runModal()
    }

    // MARK: Menus

    func buildMainMenu() {
        let main = NSMenu()

        let appItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Gati", action: #selector(showAbout(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide Gati", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Quit Gati", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        main.addItem(appItem)

        let editItem = NSMenuItem()
        let edit = NSMenu(title: "Edit")
        edit.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit
        main.addItem(editItem)

        let viewItem = NSMenuItem()
        let view = NSMenu(title: "View")
        view.addItem(withTitle: "Home", action: #selector(goHome(_:)), keyEquivalent: "1")
        view.addItem(withTitle: "Reload", action: #selector(reloadPage(_:)), keyEquivalent: "r")
        view.addItem(withTitle: "Back", action: #selector(goBack(_:)), keyEquivalent: "[")
        view.addItem(withTitle: "Forward", action: #selector(goForward(_:)), keyEquivalent: "]")
        viewItem.submenu = view
        main.addItem(viewItem)

        let windowItem = NSMenuItem()
        let win = NSMenu(title: "Window")
        win.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        win.addItem(withTitle: "Close", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        win.addItem(withTitle: "Open Gati Window", action: #selector(openMainWindow(_:)), keyEquivalent: "0")
        windowItem.submenu = win
        main.addItem(windowItem)

        NSApp.mainMenu = main
        NSApp.windowsMenu = win
    }

    func headline(_ a: GatiAlert) -> String {
        let i = a.info?[lang] ?? a.info?["ne"] ?? a.info?["en"]
        return i?.headline ?? a.identifier
    }

    func rebuildStatusMenu() {
        let menu = NSMenu()
        let n = active.count

        let head = NSMenuItem(title: n == 0
            ? t("अहिले कुनै सक्रिय आधिकारिक सूचना छैन", "No active official alert right now")
            : t("सक्रिय आधिकारिक सूचना: \(n)", "Active official alerts: \(n)"), action: nil, keyEquivalent: "")
        head.isEnabled = false
        menu.addItem(head)
        if n == 0 {
            let note = NSMenuItem(title: t("यसको अर्थ खतरा छैन भन्ने होइन।", "This is not an all clear."), action: nil, keyEquivalent: "")
            note.isEnabled = false
            menu.addItem(note)
        }
        if loadFailed {
            let fail = NSMenuItem(title: t("गतिसँग जोडिन सकिएन; पुरानो सूची देखाइएको हुन सक्छ।", "Could not reach Gati; this list may be old."), action: nil, keyEquivalent: "")
            fail.isEnabled = false
            menu.addItem(fail)
        }
        menu.addItem(NSMenuItem.separator())

        for a in active.prefix(10) {
            var title = headline(a)
            if title.count > 84 { title = String(title.prefix(82)) + "…" }
            let item = NSMenuItem(title: title, action: #selector(openAlert(_:)), keyEquivalent: "")
            item.target = self
            item.image = dotImage(severityColor(a.severity))
            item.representedObject = a.identifier
            item.toolTip = (a.severity ?? "") + " · " + headline(a)
            menu.addItem(item)
        }
        if n > 10 {
            let more = NSMenuItem(title: t("सबै सूचना हेर्नुहोस्…", "See all alerts…"), action: #selector(openPath(_:)), keyEquivalent: "")
            more.target = self
            more.representedObject = "alerts/"
            menu.addItem(more)
        }
        if n > 0 { menu.addItem(NSMenuItem.separator()) }

        let links: [(String, String, String)] = [
            ("गति खोल्नुहोस्", "Open Gati", ""),
            ("के म प्रभावित छु?", "Am I affected?", "affected/"),
            ("मार्ग जाँच", "Route check", "route/"),
            ("नक्सा", "Map", "map/"),
            ("आपतकालीन नम्बर", "Emergency numbers", "contacts/"),
        ]
        for (ne, en, path) in links {
            let item = NSMenuItem(title: t(ne, en), action: #selector(openPath(_:)), keyEquivalent: "")
            item.target = self
            item.representedObject = path
            menu.addItem(item)
        }
        menu.addItem(NSMenuItem.separator())

        let langItem = NSMenuItem(title: lang == "ne" ? "English" : "नेपाली", action: #selector(toggleLanguage(_:)), keyEquivalent: "")
        langItem.target = self
        menu.addItem(langItem)

        let ref = NSMenuItem(title: t("अहिले जाँच्नुहोस्", "Check now"), action: #selector(refresh(_:)), keyEquivalent: "")
        ref.target = self
        menu.addItem(ref)

        if let d = lastChecked {
            let f = DateFormatter()
            f.dateStyle = .none
            f.timeStyle = .short
            let item = NSMenuItem(title: t("अन्तिम जाँच: ", "Last checked: ") + f.string(from: d), action: nil, keyEquivalent: "")
            item.isEnabled = false
            menu.addItem(item)
        }
        let relay = NSMenuItem(title: t("गतिले आधिकारिक सूचना फैलाउँछ; चेतावनी जारी गर्दैन।", "Gati relays official notices. It does not issue warnings."), action: nil, keyEquivalent: "")
        relay.isEnabled = false
        menu.addItem(relay)
        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: t("गति बन्द गर्नुहोस्", "Quit Gati"), action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")

        statusItem.menu = menu
        statusItem.button?.title = n > 0 ? "ग \(n)" : "ग"
    }

    // MARK: Data refresh

    @objc func refresh(_ sender: Any?) {
        var req = URLRequest(url: siteURL.appendingPathComponent("data/alerts.json"))
        req.cachePolicy = .reloadIgnoringLocalCacheData
        req.timeoutInterval = 20
        URLSession.shared.dataTask(with: req) { [weak self] data, _, _ in
            var list: [GatiAlert]? = nil
            if let data = data, let feed = try? JSONDecoder().decode(AlertFeed.self, from: data) {
                let now = Date()
                list = feed.alerts.filter { a in
                    let trusted = a.trust == "Official" || a.trust == "Verified"
                    let live = (a.expired ?? false) == false && a.supersededBy == nil
                    let inTime = (parseDate(a.expires) ?? Date.distantFuture) > now
                    return trusted && live && inTime
                }.sorted { x, y in
                    let rx = severityRank[x.severity ?? ""] ?? 0, ry = severityRank[y.severity ?? ""] ?? 0
                    if rx != ry { return rx > ry }
                    return (x.sent ?? "") > (y.sent ?? "")
                }
            }
            DispatchQueue.main.async {
                guard let me = self else { return }
                if let list = list {
                    me.active = list
                    me.loadFailed = false
                    me.lastChecked = Date()
                } else {
                    me.loadFailed = true
                }
                me.rebuildStatusMenu()
            }
        }.resume()
    }

    // MARK: Window

    @objc func openMainWindow(_ sender: Any?) {
        if window == nil {
            let config = WKWebViewConfiguration()
            let wv = WKWebView(frame: NSRect(x: 0, y: 0, width: 1180, height: 820), configuration: config)
            wv.navigationDelegate = self
            wv.uiDelegate = self
            wv.allowsBackForwardNavigationGestures = true
            let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1180, height: 820),
                             styleMask: [.titled, .closable, .miniaturizable, .resizable],
                             backing: .buffered, defer: false)
            w.title = "गति Gati"
            w.minSize = NSSize(width: 380, height: 520)
            w.contentView = wv
            w.isReleasedWhenClosed = false
            w.delegate = self
            w.center()
            w.setFrameAutosaveName("GatiMain")
            window = w
            webView = wv
            wv.load(URLRequest(url: siteURL))
        }
        window?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func show(_ url: URL) {
        openMainWindow(nil)
        webView?.load(URLRequest(url: url))
    }

    @objc func openPath(_ sender: NSMenuItem) {
        let path = (sender.representedObject as? String) ?? ""
        show(path.isEmpty ? siteURL : siteURL.appendingPathComponent(path))
    }

    @objc func openAlert(_ sender: NSMenuItem) {
        guard let id = sender.representedObject as? String else { return }
        show(siteURL.appendingPathComponent("alerts").appendingPathComponent(id).appendingPathComponent(""))
    }

    @objc func toggleLanguage(_ sender: Any?) {
        lang = lang == "ne" ? "en" : "ne"
        rebuildStatusMenu()
    }

    @objc func goHome(_ sender: Any?) { show(siteURL) }
    @objc func reloadPage(_ sender: Any?) {
        if webView?.url == nil || webView?.url?.scheme == "about" { webView?.load(URLRequest(url: siteURL)) } else { webView?.reload() }
    }
    @objc func goBack(_ sender: Any?) { webView?.goBack() }
    @objc func goForward(_ sender: Any?) { webView?.goForward() }

    @objc func showAbout(_ sender: Any?) {
        let a = NSAlert()
        a.messageText = "गति Gati"
        a.informativeText = t(
            "नेपालका आधिकारिक विपद् र मौसम सूचना, स्रोत र समयसहित। गतिले आफैँ चेतावनी जारी गर्दैन। निराज भुसालको स्वतन्त्र, खुला स्रोत परियोजना। gatialerts.com",
            "Nepal's official disaster and weather alerts, with source and time. Gati does not issue warnings of its own. An independent, open-source project by Niraj Bhusal. gatialerts.com")
        a.addButton(withTitle: "OK")
        a.runModal()
    }

    // MARK: Web view

    func isGati(_ url: URL) -> Bool {
        guard let host = url.host else { return false }
        return host == siteHost || host.hasSuffix("." + siteHost)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.allow); return }
        let scheme = url.scheme ?? ""
        if scheme == "tel" || scheme == "mailto" || scheme == "sms" {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        // Links to other sites open in the reader's own browser, where the address is visible.
        if navigationAction.navigationType == .linkActivated, (scheme == "http" || scheme == "https"), !isGati(url) {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            if isGati(url) { webView.load(URLRequest(url: url)) } else { NSWorkspace.shared.open(url) }
        }
        return nil
    }

    func failPage(_ webView: WKWebView) {
        let title = t("गतिसँग जोडिन सकिएन", "Could not reach Gati")
        let body = t("इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्। आपत्कालमा १००, १०१, १०२ वा १२३४ मा फोन गर्नुहोस्।",
                     "Check the internet connection and try again. In an emergency call 100, 101, 102 or 1234.")
        let retry = t("फेरि प्रयास गर्नुहोस्", "Try again")
        let html = """
        <!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <body style="font:16px -apple-system,sans-serif;background:#FCF6F4;color:#2A2321;display:grid;place-items:center;height:100vh;margin:0">
        <div style="max-width:420px;padding:24px;text-align:center"><h1 style="font-size:22px">\(title)</h1><p>\(body)</p>
        <p><a href="\(siteURL.absoluteString)" style="display:inline-block;padding:10px 18px;border-radius:99px;background:#0B1424;color:#fff;text-decoration:none">\(retry)</a></p></div></body>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        let code = (error as NSError).code
        if code == NSURLErrorCancelled || code == 102 { return }
        failPage(webView)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
