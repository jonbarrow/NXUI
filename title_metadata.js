const got = require('got');
const fs = require('fs-extra');

const BUGYO_BASE = 'https://bugyo.hac.lp1.eshop.nintendo.net';
const TID_URL = `${BUGYO_BASE}/shogun/v1/contents/ids?shop_id=4&lang=en&country={c}&type=title&title_ids={t}`;
const METADATA_URL = `${BUGYO_BASE}/shogun/v1/titles/{i}?shop_id=4&lang=en&country={c}`;
const BUGYO_REGIONS = [
	'US',
	'GB', // Holy Britannian Empire
	'JP',
	'TW',
	'AU',
	'KR' 
];


let LOCAL_RESOURCES_ROOT;
if (fs.pathExistsSync('./resources')) {
	LOCAL_RESOURCES_ROOT = './resources';
} else {
	LOCAL_RESOURCES_ROOT = './';
}

const certs = {
	key: fs.readFileSync(`${LOCAL_RESOURCES_ROOT}/certs/eshop.key`),
	cert: fs.readFileSync(`${LOCAL_RESOURCES_ROOT}/certs/eshop.crt`)
};

const REQUEST_OPTIONS = {
	key: certs.key,
	cert: certs.cert,
	rejectUnauthorized: false,
	port: 443
};

async function getTitleMetadata(tid, region_id=0) {
	if (region_id > BUGYO_REGIONS.length) {
		return null;
	}

	let response;
	let json;
	try {
		response = await got(buildBugyoTIDURL(tid, BUGYO_REGIONS[region_id]), REQUEST_OPTIONS);
		json = JSON.parse(response.body);
	} catch (e) {}

	if (!json || !json.id_pairs[0]) {
		region_id++;
		return await getTitleMetadata(tid, region_id);
	}

	response = await got(buildBugyoMetadataURL(json.id_pairs[0].id, BUGYO_REGIONS[region_id]), REQUEST_OPTIONS);
	const metadata = JSON.parse(response.body);

	return metadata;
}

function buildBugyoTIDURL(tid, country='US') {
	return TID_URL.replace('{t}', tid).replace('{c}', country);
}

function buildBugyoMetadataURL(id, country='US') {
	return METADATA_URL.replace('{i}', id).replace('{c}', country);
}

async function downloadBugyoFile(uri, file) {
	return new Promise(resolve => {
		try {

			const request = got.stream(uri, REQUEST_OPTIONS).pipe(fs.createWriteStream(file));
			request.on('finish', () => {
				return resolve();
			});
		} catch (e) {}
	});
}

module.exports = {
	URLS: {
		BUGYO_BASE,
		TID_URL,
		METADATA_URL
	},
	getTitleMetadata,
	buildBugyoTIDURL,
	buildBugyoMetadataURL,
	downloadBugyoFile
};