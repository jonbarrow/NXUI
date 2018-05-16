/* eslint-env browser */

/*
	IPC events
*/

const ipcRenderer = require('electron').ipcRenderer;

(() => {
	ipcRenderer.send('initialize');
})();

ipcRenderer.on('initializing', () => {
	showNotification('loader');
	
	SOUNDS.loading.loop = true;
	SOUNDS.loading.play();
});

ipcRenderer.on('pick_emulator_path', () => {
	SOUNDS.loading.loop = false;
	SOUNDS.loading.pause();
	
	hideNotification('loader');
	showNotification('pick_emulator_path');
});

ipcRenderer.on('pick_games_path', () => {
	SOUNDS.loading.loop = false;
	SOUNDS.loading.pause();
	
	hideNotification('loader');
	showNotification('pick_games_path');
});

ipcRenderer.on('initialized', () => {
	ipcRenderer.send('ready');
});

ipcRenderer.on('rom_list', (event, rom_list) => {
	SOUNDS.loading.loop = false;
	SOUNDS.loading.pause();

	hideNotification('loader');

	const rom_min_max = 12;
	const roms_list_display = document.querySelector('.games');

	for (let i = 0; i < rom_min_max; i++) {
		const rom = rom_list[i];
		const template = document.querySelector('[template="game"]').content.firstElementChild.cloneNode(true);
		
		const title = template.querySelector('.title');
		const icon = template.querySelector('.game-icon');

		if (rom) {
			title.innerHTML = rom.title;
			icon.src = rom.icon;

			template.addEventListener('click', () => {
				template.classList.add('clicked');
				setTimeout(() => {
					template.classList.remove('clicked');
				}, 100);
				ipcRenderer.send('launch_game', rom);

				SOUNDS.runtitle.pause();
				SOUNDS.runtitle.play();
			});
		} else {
			template.removeChild(title);
			template.removeChild(icon);
			template.classList.add('blank');
		}

		template.addEventListener('mouseenter', () => {
			const active = document.querySelectorAll('.active');
			for (let i = active.length-1; i >= 0; i--) {
				const _active = active[i];
				_active.classList.remove('active');
			}

			template.classList.add('active');
			SOUNDS.game_select_change.play();
		});
		roms_list_display.appendChild(template);
	}

	SOUNDS.home.play();
});
  