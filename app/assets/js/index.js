/* eslint-env browser */

function addEvent(object, event, func) {
	object.addEventListener(event, func, true);
}

const SOUNDS = {
	loading: new Audio('assets/sounds/loading.wav'),
	home: new Audio('assets/sounds/home.wav'),
	nock: new Audio('assets/sounds/nock.wav'),
	tick: new Audio('assets/sounds/tick.wav'),
	enter_and_back: new Audio('assets/sounds/enter & back.wav'),
	runtitle: new Audio('assets/sounds/popup+runtitle.wav'),
	game_select_change: new Audio('assets/sounds/select.wav'),

	eshop: new Audio('assets/sounds/eshop.wav'),
	controllers: new Audio('assets/sounds/controller.wav'),
	settings: new Audio('assets/sounds/settings.wav')
};

(() => {
	const icons = document.querySelectorAll('.option');
	for (const icon of icons) {
		addEvent(icon, 'mouseenter', event => {
			if (!event.target.classList.contains('icon')) {
				return;
			}

			const active = document.querySelectorAll('.active');
			for (let i = active.length-1; i >= 0; i--) {
				const _game = active[i];
				_game.classList.remove('active');
			}

			icon.classList.add('active');
			SOUNDS.game_select_change.play();
		});

		addEvent(icon, 'click', () => {
			showNotification('coming_soon');
		});
	}

	addEvent(document.querySelector('.profile'), 'mouseenter', () => {
		const active = document.querySelectorAll('.active');
		for (let i = active.length-1; i >= 0; i--) {
			const _game = active[i];
			_game.classList.remove('active');
		}

		document.querySelector('.profile').classList.add('active');
		SOUNDS.game_select_change.play();
	});

	addEvent(document.querySelector('.profile'), 'click', () => {
		showNotification('coming_soon');
	});
	
	addEvent(document.querySelector('.option[option="controllers"]'), 'click', () => {
		SOUNDS.controllers.play();
	});
	addEvent(document.querySelector('.option[option="settings"]'), 'click', () => {
		SOUNDS.settings.play();
	});
})();