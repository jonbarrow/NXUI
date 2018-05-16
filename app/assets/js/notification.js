/* eslint-env browser */

const notification_list = document.querySelector('.notifications');
let last_active;

function addEvent(object, event, func) {
	object.addEventListener(event, func, true);
}

function createNotification(body, buttons=[{text:'OK'}], id) {
	const element = document.querySelector('[template="notification"]').content.firstElementChild.cloneNode(true);
	element.querySelector('p').innerHTML = body;
	element.id = id;

	for (let i = 0; i < 2; i++) {
		const button = buttons[i];
		if (button) {
			const button_element = document.createElement('button');
			button_element.className = 'button';
			button_element.innerHTML = (button.text ? button.text : 'OK');

			addEvent(button_element, 'click', () => {
				SOUNDS.enter_and_back.play();
			});

			addEvent(button_element, 'mouseenter', () => {
				const active = document.querySelectorAll('.active');
				for (let i = active.length-1; i >= 0; i--) {
					const _active = active[i];
					_active.classList.remove('active');
				}
	
				button_element.classList.add('active');
				SOUNDS.game_select_change.play();
			});

			if (button.handler) {
				addEvent(button_element, 'click', button.handler);
			}

			addEvent(button_element, 'click', () => {
				const active = document.querySelectorAll('.active');
				for (let i = active.length-1; i >= 0; i--) {
					const _active = active[i];
					_active.classList.remove('active');
				}
				last_active.classList.add('active');
				element.classList.remove('show');
			});

			element.querySelector('.interaction').appendChild(button_element);
		}
	}

	notification_list.appendChild(element);
}

const showNotification = (id) => {
	SOUNDS.nock.play();
	const shown = document.querySelectorAll('.notification.show');
	for (let i = shown.length-1; i >= 0; i--) {
		const notification = shown[i];
		notification.classList.remove('show');
	}

	const active = document.querySelectorAll('.active');
	for (let i = active.length-1; i >= 0; i--) {
		const _active = active[i];
		_active.classList.remove('active');
		last_active = _active;
	}

	const button = document.querySelector(`#${id}`).querySelector('button');
	if (button) {
		button.classList.add('active');
	}

	document.querySelector(`#${id}`).classList.add('show');
};

const hideNotification = (id) => {
	document.querySelector(`#${id}`).classList.remove('show');
};

createNotification('Path to Switch emulator not set. Please select a path.', [
	{
		text: 'OK',
		handler: () => {
			ipcRenderer.sendSync('pick_emulator_path');
			ipcRenderer.send('initialize');
		}
	}
], 'pick_emulator_path');

createNotification('Path to games folder not set. Please select a path.', [
	{
		text: 'OK',
		handler: () => {
			ipcRenderer.sendSync('pick_games_path');
			ipcRenderer.send('initialize');
		}
	}
], 'pick_games_path');

createNotification('This feature is not yet implemented!', [
	{
		text: 'OK'
	}
], 'coming_soon');