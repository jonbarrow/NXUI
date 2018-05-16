/* eslint-env browser */

function horizontalScroll(event) {
	if (event.deltaY != 0) {
		const scroll_ammount = event.wheelDelta;
		const scroll_direction = (scroll_ammount > 0 ? 'right' : 'left');
		
		if (scroll_direction == 'left') {
			window.scroll(window.scrollX + 100, window.scrollY);
		} else {
			window.scroll(window.scrollX - 100, window.scrollY);
		}
		
		event.preventDefault();
	}
	return;
}

window.addEventListener('wheel', horizontalScroll);