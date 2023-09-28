const toggler = document.getElementById('toggler');
toggler.checked = JSON.parse(localStorage.getItem('menu'));
document.addEventListener('keydown', ev => {
    if (ev.key == "m") {
        toggler.click();
    }
});

toggler.addEventListener('change', ev => { 
    localStorage.setItem('menu', toggler.checked);
})