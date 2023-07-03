const codeElements = document.querySelectorAll('pre.chroma:has(code:is(.language-html, .language-css, .language-js))');

for (const code of codeElements) {
    const highlight = code.closest('.highlight');
    const btn = document.createElement("button");
    btn.classList.add("copy-to-clipboard")
    btn.textContent = "copy to clipboard";
    highlight.appendChild(btn);
    btn.addEventListener('click', ev => {
        navigator.clipboard.writeText(code.textContent);
    })
}

