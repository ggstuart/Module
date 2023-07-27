document.getElementById('toggler').checked = JSON.parse(localStorage.getItem('menu'));
document.addEventListener('keydown', ev => {
    if (ev.key == "m") {
        document.getElementById('toggler').checked ^= 1;
        localStorage.setItem('menu', document.getElementById('toggler').checked);
    }
});
