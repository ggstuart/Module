const codeElements = document.querySelectorAll('pre.chroma:has(code:is(.language-html, .language-css, .language-js, .language-JavaScript, .language-json, .language-php, .language-phtml))');

// The clipboard API can be unavailable (http pages) or blocked (pages shown
// inside another site's frame, e.g. Learning Zone), so fall back to the
// older copy command.
function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
        return document.execCommand("copy");
    } finally {
        area.remove();
    }
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        return fallbackCopy(text);
    }
}

for (const code of codeElements) {
    const highlight = code.closest('.highlight');
    const btn = document.createElement("button");
    btn.classList.add("copy-to-clipboard")
    btn.textContent = "copy to clipboard";
    highlight.appendChild(btn);
    btn.addEventListener('click', async ev => {
        const copied = await copyText(code.textContent);
        btn.textContent = copied ? "copied" : "copy failed";
        setTimeout(() => { btn.textContent = "copy to clipboard"; }, 1500);
    })
}
