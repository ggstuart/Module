document.addEventListener('keydown', ev => {
    if (ev.key == "m") {
        document.getElementById('toggler').checked ^= 1;
    }
});
