// Learning Zone export: behaviour that matters once a page is inside a
// Learning Zone (Brightspace) content frame. Only included in packages built
// with `--environment learningzone`.
(() => {
    "use strict";

    // The package root, worked out from where this script lives
    // (learningzone/learningzone.js).
    const script = document.currentScript;
    const packageRoot = script ? new URL("../", script.src) : null;

    // Links to a folder ("../unit/") have no index.html lookup in Learning
    // Zone, so point them at the file. Links that still start at the site
    // root ("/unit/" or "//unit/") are made relative to the package root.
    for (const a of document.querySelectorAll("a[href]")) {
        let href = a.getAttribute("href");
        if (packageRoot) {
            const rootPath = href.match(/^\/\/([^/.:?#]+(?:[/?#].*)?)$/) || href.match(/^\/(?!\/)(.*)$/);
            if (rootPath && !/^localhost\b/.test(rootPath[1])) {
                href = new URL(rootPath[1], packageRoot).href;
                const here = new URL(".", window.location.href).href;
                if (href.startsWith(packageRoot.href) && here.startsWith(packageRoot.href)) {
                    const up = here.slice(packageRoot.href.length).split("/").filter(Boolean).length;
                    href = "../".repeat(up) + href.slice(packageRoot.href.length);
                }
                a.setAttribute("href", href);
            }
        }
        if (/^[a-z][a-z0-9+.-]*:|^\/\/|^#/i.test(href)) continue;
        const [path, rest = ""] = href.split(/(?=[?#])/);
        if (path === "" || path.endsWith("/")) {
            a.setAttribute("href", `${path}index.html${rest}`);
        } else if (path === "." || path === "..") {
            a.setAttribute("href", `${path}/index.html${rest}`);
        }
    }

    // Copy buttons: clipboard access can be blocked inside a frame, so fall
    // back to the older copy command and show a tick either way.
    const fallbackCopy = text => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } finally { ta.remove(); }
        return Promise.resolve();
    };
    const clip = navigator.clipboard;
    const original = clip && clip.writeText ? clip.writeText.bind(clip) : null;
    const safeWrite = text => original
        ? original(text).catch(() => fallbackCopy(text))
        : fallbackCopy(text);
    try {
        if (clip) {
            clip.writeText = safeWrite;
        } else {
            Object.defineProperty(navigator, "clipboard", { value: { writeText: safeWrite } });
        }
    } catch (e) { /* leave the default behaviour */ }
    document.addEventListener("click", ev => {
        const btn = ev.target.closest && ev.target.closest("button.copy-to-clipboard");
        if (!btn) return;
        btn.classList.add("lz-copied");
        setTimeout(() => btn.classList.remove("lz-copied"), 1500);
    });

    // Slide decks: arrow keys only reach a frame that has focus, so take
    // focus on load and on any click, and add on-screen controls.
    if (!document.body.classList.contains("presentation")) return;

    const press = key => document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    const slides = Array.from(document.querySelectorAll(".presentation .slide"));
    const focusFrame = () => { try { window.focus(); } catch (e) { /* ignore */ } };

    const footer = document.querySelector("body > footer") || document.body.appendChild(document.createElement("footer"));
    const controls = document.createElement("div");
    controls.className = "lz-slide-controls";
    const button = (label, title, action) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.title = title;
        b.addEventListener("click", ev => { ev.stopPropagation(); action(); focusFrame(); });
        controls.appendChild(b);
        return b;
    };
    button("\u2190", "Previous slide (left arrow)", () => press("ArrowLeft"));
    const counter = document.createElement("span");
    counter.className = "lz-counter";
    counter.setAttribute("aria-live", "polite");
    controls.appendChild(counter);
    button("\u2192", "Next slide (right arrow)", () => press("ArrowRight"));
    if (document.fullscreenEnabled) {
        button("\u26F6", "Full screen (f)", () => toggleFullscreen());
    } else {
        button("\u2197", "Open in a new window", () => window.open(window.location.href, "_blank"));
    }
    footer.appendChild(controls);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.body.requestFullscreen().catch(() => window.open(window.location.href, "_blank"));
        }
    };

    const update = () => {
        const current = document.querySelector(".presentation .slide.current");
        counter.textContent = `${slides.indexOf(current) + 1} / ${slides.length}`;
    };
    new MutationObserver(update).observe(document.querySelector("main"), { subtree: true, attributes: true, attributeFilter: ["class"] });
    update();

    document.addEventListener("keydown", ev => {
        if (ev.key === "f" && document.fullscreenEnabled && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggleFullscreen();
        if (ev.key === "PageDown" || ev.key === " ") { ev.preventDefault(); press("ArrowRight"); }
        if (ev.key === "PageUp") { ev.preventDefault(); press("ArrowLeft"); }
    });
    document.addEventListener("pointerdown", focusFrame);
    window.addEventListener("load", focusFrame);
    focusFrame();

    const instructions = document.getElementById("instructions");
    if (instructions) instructions.textContent = "Click the slide, then use the arrow keys, or the buttons";
})();
