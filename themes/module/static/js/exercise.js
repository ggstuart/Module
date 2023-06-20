const codeElements = document.querySelectorAll('.chroma:has(code:is(.language-html, .language-css, .language-js))');

for (const code of codeElements) {
    const btn = document.createElement("button");
    btn.textContent = "copy to clipboard";
    code.parentNode.appendChild(btn);
    btn.addEventListener('click', ev => {
        navigator.clipboard.writeText(code.textContent);
        btn.classList.add('clicked');
    })
    btn.addEventListener('transitionend', ev => {
        btn.classList.remove('clicked');
    });
}