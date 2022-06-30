// stuff
const fetch = require('node-fetch');
const settings = require('./settings.json');

// for downloading
const fs = require('fs');
const http = require('node:https');
const urlData = {};

// functions
async function getAssetName(id, cookie) {
	// i KNOW you can use this api without the cookie but i'll use it anyways
	let response = await fetch('https://api.roblox.com/marketplace/productinfo?assetId=' + id, {
		Headers: {
			"User-Agent": "Roblox/WinInet",
			"Cookie": ".ROBLOSECURITY=" + cookie
		}
	})
	if (response.status == 200) {
		let jsonInfo = await response.json();
		if (jsonInfo["Name"] && jsonInfo["Creator"] && jsonInfo.Creator["Name"]) {
			return jsonInfo["Name"] + ' - ' + jsonInfo.Creator.Name
		} else {
			console.log('	[DEBUG]: JSON Error while trying to get asset info from '+ id +': "'+ JSON.stringify(jsonInfo) +'"')
			return 'Audio ('+ id +') - Unknown uploader'
		}
	} else {
		let txt = await response.text();
		console.log('	[DEBUG]: Response error while trying to get asset info from '+ id +': "'+ txt +'"')
		return 'Audio ('+ id +') - Unknown uploader'
	}
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
				toReturn.push({
					"assetId": bodyArray[index].assetId, 
					"url": obj.locations[0].location
				})
			}
		})
	}
	
	return toReturn
}

const main = async () => {
	let locations = await getAudiosLocations(settings.audioIds, settings.placeId, settings.cookie);
	for (var obj of locations) {
		// looks messy AF but it's a better solution for the script downloading all shit in the same moment
		// don't judge me, i'm still a newbie in js
		console.log('	[DOWNLOAD]: starting the download of', obj.assetId)
		let name = await getAssetName(obj.assetId, settings.cookie);
		
		let download = (url, audioName) => new Promise((resolve, reject) => {
			let file = fs.createWriteStream('./audios/' + audioName + '.ogg');
			http.get(url, function(response) {
				response.pipe(file)
				file.on('finish', function() {
					file.close()
					console.log('	[DOWNLOAD]: the audio "'+ audioName +'" was downloaded successfully (URL: '+ url + ')\n')
					setTimeout(function() {
						resolve('success');
					}, 900); // cute delay
				})
			}).on('error', function(err) {
				console.log('	[DOWNLOAD]: the audio "'+ audioName +'" wasn\'t downloaded successfully (ERROR: "'+ err +'") (URL: ' + url + ')\n')
				setTimeout(function() {
					resolve('error');
				}, 900); // cute delay
			})
		})
		
		await download(obj.url, name)
	}
	
	console.log('\n[INFO]: process ended, check the "audios" folder')
}

console.log('[INFO]: starting process\n')
console.log('[INFO]: download logs:')

main()
