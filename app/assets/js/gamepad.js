/* eslint-env browser */

Controller.search({
	settings: {
		useAnalogAsDpad: 'both'
	}
});

let focussed = true;

window.onfocus = () => { 
	focussed = true; 
}; 

window.onblur = () => { 
	focussed = false; 
}; 

window.addEventListener('gc.button.press', event => {
	if (!focussed || !checkGamepadCursor()) {
		return;
	}

	const detail = event.detail;
	const active_notification = document.querySelector('.notification.show');
	let active;
	let next;

	if (active_notification) {
		active = document.querySelector('.active');
		if (active) {
			active.classList.remove('active');
		}
		
		next = active_notification.querySelector('button');
		next.classList.add('active');

		switch (detail.name) {
			case 'DPAD_RIGHT':
				active = document.querySelector('.active');
				next = active.nextElementSibling;
				if (next) {
					active.classList.remove('active');
					next.classList.add('active');
					SOUNDS.game_select_change.play();
				}
				break;
			case 'DPAD_LEFT':
				active = document.querySelector('.active');
				next = active.previousElementSibling;
				if (next) {
					active.classList.remove('active');
					next.classList.add('active');
					SOUNDS.game_select_change.play();
				}
				break;
			case 'FACE_1': // XBox A
				document.querySelector('.active').click();
				break;
		
			default:
				break;
		}

		return;
	}

	switch (detail.name) {
		case 'DPAD_RIGHT':
			active = document.querySelector('.active');
			next = active.nextElementSibling;

			if (next) {
				SOUNDS.game_select_change.play();
				
				active.classList.remove('active');
				next.classList.add('active');
				next.scrollIntoView(true);
				if (next.classList.contains('option')) {
					return;
				}
				if ((next.nextElementSibling && !isVisible(next.nextElementSibling)) || !next.nextElementSibling) {
					window.scrollBy(20, 0);
				}
			} else if (active.classList.contains('game')) {
				SOUNDS.tick.play();
				active.classList.add('wobble-right');
				setTimeout(() => {
					active.classList.remove('wobble-right');
				}, 200);
			}
			break;
		case 'DPAD_LEFT':
			active = document.querySelector('.active');
			next = active.previousElementSibling;

			if (next) {
				SOUNDS.game_select_change.play();
				
				active.classList.remove('active');
				next.classList.add('active');
				next.scrollIntoView(true);
				if (next.classList.contains('option')) {
					return;
				}
				if ((next.previousElementSibling && !isVisible(next.previousElementSibling)) || !next.previousElementSibling) {
					window.scrollBy(-20, 0);
				}
			} else if (active.classList.contains('game')) {
				SOUNDS.tick.play();
				active.classList.add('wobble-left');
				setTimeout(() => {
					active.classList.remove('wobble-left');
				}, 200);
			}
			break;
		case 'FACE_1': // XBox A
			document.querySelector('.active').click();
			break;

		case 'DPAD_UP':
			active = document.querySelector('.active');

			if (active.classList.contains('game')) {
				active.classList.remove('active');
				next = document.querySelector('.profile.icon');
				next.classList.add('active');
			} else if (active.classList.contains('option')) {
				active.classList.remove('active');
				next = document.querySelector('.game');
				next.classList.add('active');
				next.scrollIntoView(true);
				if ((next.previousElementSibling && !isVisible(next.previousElementSibling)) || !next.previousElementSibling) {
					window.scrollBy(-20, 0);
				}
			}
			break;
		
		case 'DPAD_DOWN':
			active = document.querySelector('.active');
			if (active.classList.contains('profile')) {
				active.classList.remove('active');
				next = document.querySelector('.game');
				next.classList.add('active');
				next.scrollIntoView(true);
				if ((next.previousElementSibling && !isVisible(next.previousElementSibling)) || !next.previousElementSibling) {
					window.scrollBy(-20, 0);
				}
			} else if (active.classList.contains('game')) {
				active.classList.remove('active');
				next = document.querySelector('.option');
				next.classList.add('active');
			}
			break;
	}
});

function checkGamepadCursor() {
	const active = document.querySelector('.active');
	if (!active) {
		document.querySelector('.game').classList.add('active');
		return false;
	}

	return true;
}

// https://stackoverflow.com/a/41698614
function isVisible(elem) {
	if (!(elem instanceof Element)) throw Error('DomUtil: elem is not an element.');
	const style = getComputedStyle(elem);
	if (style.display === 'none') return false;
	if (style.visibility !== 'visible') return false;
	if (style.opacity < 0.1) return false;
	if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height +
		elem.getBoundingClientRect().width === 0) {
		return false;
	}
	const elemCenter   = {
		x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
		y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
	};
	if (elemCenter.x < 0) return false;
	if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
	if (elemCenter.y < 0) return false;
	if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
	let pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
	do {
		if (pointContainer === elem) return true;
	} while (pointContainer = pointContainer.parentNode);
	return false;
}