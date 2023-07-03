const slides = Array.from(document.querySelectorAll('.presentation .slide'));
const firstSlide = document.querySelector(`.presentation .slide:first-of-type`);
const lastSlide = document.querySelector(`.presentation .slide:last-of-type`);
const progress = document.querySelector('#slide-progress div');

const params = new URLSearchParams(document.location.search);
const startSlideNumber = params.has('slide') ? params.get("slide") : 1;
const startSlide = getSlideByPosition(startSlideNumber);
activateSlide(startSlide);

function getSlideByPosition(position) {
    const slide = document.querySelector(`.presentation .slide:nth-of-type(${position})`);
    return slide || document.querySelector(`.presentation .slide:first-of-type`);
}

function activateSlide(slide) {
	params.set('slide', slides.indexOf(slide) + 1);
	window.history.replaceState({}, "", `${window.location.origin}${window.location.pathname}?${params.toString()}`);
    document.querySelectorAll('.presentation .slide.current').forEach(s => s.classList.remove('current'));
    document.querySelectorAll('.presentation .slide.next').forEach(s => s.classList.remove('next'));
    document.querySelectorAll('.presentation .slide.prev').forEach(s => s.classList.remove('prev'));;
    slide.classList.add("current");
    const next = slide.nextElementSibling || document.querySelector('.presentation .slide:first-of-type');
    const prev = slide.previousElementSibling || document.querySelector('.presentation .slide:last-of-type');
    next.classList.add("next");
    prev.classList.add("prev");
    progress.style.setProperty('--progress', `${slides.indexOf(slide) / (slides.length-1) * 100}%`);
}

function nextSlide() {
    const current = document.querySelector('.presentation .slide.current')
    const next = current.nextElementSibling || document.querySelector('.presentation .slide:first-of-type');
    activateSlide(next);
}
function prevSlide() {
    const current = document.querySelector('.presentation .slide.current')
    const prev = current.previousElementSibling || document.querySelector('.presentation .slide:last-of-type');
    activateSlide(prev);
}

document.addEventListener('keydown', ev => {
    switch(ev.key) {
        case "ArrowRight":
            nextSlide();
            break;

        case "ArrowLeft":
            prevSlide();
            break;
    }
});

let touchX;
document.addEventListener('touchstart', ev => {
	touchX = ev.touches[0].clientX;
});
document.addEventListener('touchmove', ev => {
	if(touchX) {
		let moveX = touchX - ev.touches[0].clientX;
		if (moveX < -50) {
			prevSlide();
			touchX = null;
		}	else if (moveX > 50) {
			nextSlide();
			touchX = null;
		}
	}
});
