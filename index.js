const {BrowserWindow, app, ipcMain, dialog} = require('electron');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const NXReader = require('nxreader');
const title_metadata = require('./title_metadata');

let LOCAL_RESOURCES_ROOT;
if (isDev()) {
	require('electron-reload')(__dirname);
	LOCAL_RESOURCES_ROOT = __dirname;
} else {
	LOCAL_RESOURCES_ROOT = `${__dirname}/../`;
}

const DATA_ROOT = app.getPath('userData').replace(/\\/g, '/') + '/app_data';

let game_storage;
let settings_storage;
let ApplicationWindow;

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit(); // OSX
	}
});

app.on('ready', () => {
	ApplicationWindow = new BrowserWindow({
		title: 'NXUI',
		icon: `${LOCAL_RESOURCES_ROOT}/icon.ico`,
		minHeight: '300px',
		minWidth: '500px'
	});

	ApplicationWindow.setMenu(null);
	ApplicationWindow.maximize();

	ApplicationWindow.webContents.on('did-finish-load', () => {
		ApplicationWindow.show();
		ApplicationWindow.focus();
	});
		
	ApplicationWindow.loadURL(url.format({
		pathname: path.join(__dirname, '/app/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	ApplicationWindow.on('closed', () => {
		ApplicationWindow = null;
	});

	ApplicationWindow.webContents.openDevTools();
});

ipcMain.on('initialize', async (event) => {
	await initialize();
	event.returnValue = 'done';
});

ipcMain.on('pick_emulator_path', event => {
	const emulator_path = pickEmulatorPath();
	settings_storage.set('emulator_path', emulator_path).write();
	
	event.returnValue = 'done';
});

ipcMain.on('pick_games_path', event => {
	const games_path = pickGameFolder();
	settings_storage.set('games_path', games_path).write();
	
	event.returnValue = 'done';
});

ipcMain.on('ready', event => {
	const rom_list = game_storage.toJSON();

	event.sender.send('rom_list', rom_list);
});

ipcMain.on('launch_game', (event, rom) => {
	exec(`"${settings_storage.get('emulator_path').value()}" "${rom.path}"`, error => {
		if (error) {
			throw error;
		}
	});
});

ipcMain.on('controller_event', (event, data) => {
	event.sender.send('controller_event', data);
	switch (data.name) {
		case 'found':
			event.sender.send('controller_found', data.event);
			break;
		case 'button_press':
			event.sender.send('controller_button_press', data.event);
			break;
		default:
			break;
	}
});

async function initialize() {
	ApplicationWindow.webContents.send('initializing');

	fs.ensureDirSync(`${DATA_ROOT}/cache/images`);
	fs.ensureDirSync(`${DATA_ROOT}/cache/json`);

	if (!fs.existsSync(`${DATA_ROOT}/cache/json/settings.json`)) {
		fs.writeFileSync(`${DATA_ROOT}/cache/json/settings.json`, JSON.stringify({}));
	}

	if (!fs.existsSync(`${DATA_ROOT}/cache/json/games.json`)) {
		fs.writeFileSync(`${DATA_ROOT}/cache/json/games.json`, JSON.stringify([]));
	}

	const settings_defaults = {
		emulator_path: '',
		games_path: ''
	};
	const games_defaults = [];

	game_storage = low(new FileSync(`${DATA_ROOT}/cache/json/games.json`));
	game_storage.defaults(games_defaults).write();

	settings_storage = low(new FileSync(`${DATA_ROOT}/cache/json/settings.json`));
	settings_storage.defaults(settings_defaults).write();

	if (
		!settings_storage.get('emulator_path') ||
		settings_storage.get('emulator_path') === '' ||
		!fs.pathExistsSync(settings_storage.get('emulator_path').value())
	) {
		ApplicationWindow.webContents.send('pick_emulator_path');
		return;
	}

	if (
		!settings_storage.get('games_path') ||
		settings_storage.get('games_path') == '' ||
		!fs.pathExistsSync(settings_storage.get('games_path').value())
	) {
		ApplicationWindow.webContents.send('pick_games_path');
		return;
	}
	await updateGameCache();

	ApplicationWindow.webContents.send('initialized');
}

function pickEmulatorPath() {
	const emulator_path = dialog.showOpenDialog({
		title: 'Select your emulator executable',
		message: 'Select your emulator executable',
		properties: ['openFile'],
		filters: [
			{name: 'All Executables', extensions: ['exe']}
		]
	});

	if (!emulator_path) {
		return false;
	}
	return emulator_path[0];
}

function pickGameFolder() {
	const folder = dialog.showOpenDialog({
		title: 'Select your games folder',
		message: 'Select your games folder',
		properties: ['openDirectory']
	});

	if (!folder) {
		return false;
	}
	return folder[0];
}

async function updateGameCache() {
	const games = game_storage.value();
	for (let i = games.length-1; i >= 0; i--) {
		const game = games[i];
		if (!fs.pathExistsSync(game.path)) {
			game_storage.remove(game).write();
		}
	}

	const src = settings_storage.get('games_path').value();
	const files = fs.readdirSync(src).filter(file => fs.statSync(path.join(src, file)).isFile());

	for (const file of files) {
		if (game_storage.find({ path: path.join(src, file) }).value()) {
			continue;
		}

		const rom_path = path.join(src, file);
		let metadata;
		switch (path.extname(file)) {
			case '.nca':
				const NCA = NXReader.parseNCA(path.join(src, file));
				const NCA_metadata = await title_metadata.getTitleMetadata(NCA.header.tid);
				if (NCA_metadata) {
					fs.ensureDirSync(`${DATA_ROOT}/cache/images/${NCA_metadata.applications[0].id}`);
					
					if (!fs.pathExistsSync(`${DATA_ROOT}/cache/images/${NCA_metadata.applications[0].id}/icon.jpg`)) {
						await title_metadata.downloadBugyoFile(
							`${title_metadata.URLS.BUGYO_BASE}${NCA_metadata.applications[0].image_url}`,
							`${DATA_ROOT}/cache/images/${NCA_metadata.applications[0].id}/icon.jpg`
						);
					}

					metadata = {
						type: 'nca',
						title: NCA_metadata.applications[0].name,
						icon: `${DATA_ROOT}/cache/images/${NCA_metadata.applications[0].id}/icon.jpg`,
						path: rom_path,
						extended: NCA_metadata
					};
				} else {
					metadata = {
						type: 'nca',
						title: file,
						icon: `${LOCAL_RESOURCES_ROOT}/default_icon.jpg`,
						path: rom_path
					};
				}

				break;
			case '.nro':
				metadata = {
					type: 'nro',
					title: file,
					path: rom_path,
					icon: `${LOCAL_RESOURCES_ROOT}/default_icon.jpg`
				};

				const nro_metadata = NXReader.parseNRO(rom_path);
				if (nro_metadata.is_homebrew) {
					const nro_stream = fs.openSync(rom_path, 'r');
					const nro_size = Buffer.alloc(4);
					fs.readSync(nro_stream, nro_size, 0, 4, 0x18);

					nro_metadata.homebrew.asset_section_headers.icon.file_offset.swap64();
					nro_metadata.homebrew.asset_section_headers.icon.size.swap64();

					nro_metadata.homebrew.asset_section_headers.nacp.file_offset.swap64();
					nro_metadata.homebrew.asset_section_headers.nacp.size.swap64();

					let icon_offset = nro_metadata.homebrew.asset_section_headers.icon.file_offset;
					let icon_size = nro_metadata.homebrew.asset_section_headers.icon.size;
					icon_offset = (icon_offset.readUInt32BE() << 8) + icon_offset.readUInt32BE(4) + nro_size.readUInt32LE();
					icon_size = (icon_size.readUInt32BE() << 8) + icon_size.readUInt32BE(4);

					let nacp_offset = nro_metadata.homebrew.asset_section_headers.nacp.file_offset;
					let nacp_size = nro_metadata.homebrew.asset_section_headers.nacp.size;
					nacp_offset = (nacp_offset.readUInt32BE() << 8) + nacp_offset.readUInt32BE(4) + nro_size.readUInt32LE();
					nacp_size = (nacp_size.readUInt32BE() << 8) + nacp_size.readUInt32BE(4);
					
					const nro_icon = Buffer.alloc(icon_size);
					fs.readSync(nro_stream, nro_icon, 0, icon_size, icon_offset);

					const nro_nacp = Buffer.alloc(nacp_size);
					fs.readSync(nro_stream, nro_nacp, 0, nacp_size, nacp_offset);

					metadata.icon = `data:image/jpg;base64,${nro_icon.toString('base64')}`;
					metadata.title = Buffer.from(nro_nacp.subarray(0, 0x200)).toString().replace(/\0/g, '');
				}
				break;
			default:
				break;
		}

		if (metadata) {
			game_storage.push(metadata).write();
		}
	}
}

// https://github.com/electron/electron/issues/7714#issuecomment-255835799
function isDev() {
	return process.mainModule.filename.indexOf('app.asar') === -1;
}