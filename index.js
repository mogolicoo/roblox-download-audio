// stuff
const fetch = require('node-fetch');
const settings = require('./settings.json');

// for downloading
const fs = require('fs');
const http = require('node:https');

// functions
async function download(url, audioName) {
	let file = fs.createWriteStream('./audios/' + audioName + '.ogg');
	http.get(url, function(response) {
		response.pipe(file)
		file.on('finish', function() {
			file.close()
			console.log('the audio "', audioName, '" was downloaded successfully (URL: '+ url + ')')
		})
	}).on('error', function(err) {
		console.log('the audio "', audioName, '" wasn\'t downloaded successfully ('+ err +') (URL: ' + url + ')')
	})
}

async function getAudiosLocations(idArray, placeId, cookie) {
	let bodyArray = [];
	let toReturn = [];
	
	idArray.forEach(function(id, _) {
		bodyArray.push({
			"assetId": id,
			"assetType": "Audio",
			"requestId": "0"
		})
	})
	
	let response = await fetch('https://assetdelivery.roblox.com/v2/assets/batch', {
		method: "POST",
		headers: {
			"User-Agent": "Roblox/WinInet",
			"Content-Type": "application/json",
			"Cookie": ".ROBLOSECURITY="+cookie,
			"Roblox-Place-Id": placeId,
			"Accept": "*/*",
			"Roblox-Browser-Asset-Request": "false"
		},
		body: JSON.stringify(bodyArray)
	})
	
	if (response.status == 200) {
		let locations = await response.json();
		locations.forEach(async function(obj, index) {
			if (obj["locations"] && obj.locations[0]["location"]) {
				toReturn.push(obj.locations[0].location)
			}
		})
	}
	
	return toReturn
}

async function main() {
	let locations = await getAudiosLocations(settings.audioIds, settings.placeId, settings.cookie);
	locations.forEach(async function(url, index) {
		download(url, index)
	})
}

main()