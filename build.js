const builder = require('electron-builder');
const targets = builder.Platform;

builder.build({
	targets: targets.WINDOWS.createTarget(),
	config: {
		appId: 'com.nxui.app',
		productName: 'NXUI',
		asar: true,
		icon: 'icon.ico',
		directories: {
			output: 'builds'
		},
		extraResources: [
			'certs',
			'default_icon.jpg'
		],
		files: [
			'!builds',
			'!.gitignore',
			'!README.md',
			'!build.js',
		],
	}
}).then(() => {
	console.log('Done');
}).catch((error) => {
	throw error;
});