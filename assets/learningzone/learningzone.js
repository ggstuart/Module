// Learning Zone export: behaviour that matters once a page is inside a
// Learning Zone (Brightspace) content frame. Only included in packages built
// with `--environment learningzone`.
(() => {
    "use strict";

    // Links to a folder ("../unit/") have no index.html lookup in Learning
    // Zone, so point them at the file.
    for (const a of document.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href");
        if (/^[a-z][a-z0-9+.-]*:|^\/\/|^#/i.test(href)) continue;
        const [path, rest = ""] = href.split(/(?=[?#])/);
        if (path === "" || path.endsWith("/")) {
            a.setAttribute("href", `${path}index.html${rest}`);
        } else if (path === "." || path === "..") {
            a.setAttribute("href", `${path}/index.html${rest}`);
        }
    }

    // Diagrams: the page only loads the bundled Mermaid when it has one.
    if (window.mermaid) {
        window.mermaid.initialize({
            startOnLoad: false,
            er: { layoutDirection: "LR", fontSize: "1em" },
            theme: "base",
        });
        window.mermaid.run({ querySelector: "pre.mermaid" });
    }

    // Slide decks: arrow keys only reach a frame that has focus, so take
    // focus on load and on any click, and add on-screen controls.
    if (!document.body.classList.contains("presentation")) return;

    const press = key => document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    const focusFrame = () => { try { window.focus(); } catch (e) { /* ignore */ } };

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.body.requestFullscreen().catch(() => window.open(window.location.href, "_blank"));
        }
    };

    const footer = document.querySelector("body > footer") || document.body.appendChild(document.createElement("footer"));
    const controls = document.createElement("div");
    controls.className = "lz-slide-controls";
    const button = (label, title, action) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.title = title;
        b.setAttribute("aria-label", title);
        b.addEventListener("click", ev => { ev.stopPropagation(); action(); focusFrame(); });
        controls.appendChild(b);
        return b;
    };
    button("\u2190", "Previous slide (left arrow)", () => press("ArrowLeft"));
    button("\u2192", "Next slide (right arrow)", () => press("ArrowRight"));
    if (document.fullscreenEnabled) {
        button("\u26F6", "Full screen (f)", toggleFullscreen);
    } else {
        button("\u2197", "Open in a new window", () => window.open(window.location.href, "_blank"));
    }
    footer.appendChild(controls);

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
