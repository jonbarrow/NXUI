/* eslint-env browser */

function horizontalScroll(event) {
	if (event.deltaY != 0) {
		const scroll_ammount = event.wheelDelta;
		const scroll_direction = (scroll_ammount > 0 ? 'right' : 'left');
		
		if (scroll_direction == 'left') {
			document.querySelector('.games').scrollLeft += 100;
		} else {
			document.querySelector('.games').scrollLeft -= 100;
		}
		
		event.preventDefault();
	}
}

window.addEventListener('wheel', horizontalScroll);