// Add a "copy to clipboard" button to every highlighted code listing, whatever
// its language, except plain-text listings (usually program output).
const noCopy = ['plaintext', 'text', 'txt'];
const codeElements = Array.from(document.querySelectorAll('pre.chroma:has(code[data-lang])'))
    .filter(pre => !noCopy.includes(pre.querySelector('code[data-lang]').dataset.lang.toLowerCase()));

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

