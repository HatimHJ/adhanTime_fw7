var $$ = Dom7;
var coords;
var year = new Date().getFullYear().toString();
var method = "4";

$$(document).on("pageInit", function (e) {
	if (e.detail.page.name === "index") {
		navigator.geolocation.getCurrentPosition(
			(pos) => init(pos.coords.latitude, pos.coords.longitude, year, method),
			() => init(21.51694, 39.21917, year, method)
		);

		$$("#search-btn").on("click", () => {
			preloading();
			handleInput(year, method);
		});
	}
});

// Initialize your app
var myApp = new Framework7();

// Add view
var mainView = myApp.addView(".view-main", {
	dynamicNavbar: true,
});

async function init(lat, lon, year, method) {
	const coords = { lat, lon };
	const cityName = await CoordToCity(coords);
	handleFetchData(cityName, coords, year, method);
}

async function cityToCoord(city) {
	const url = "https://geocode.maps.co/search?q=" + city;
	var res = await fetch(url);
	const data = await res.json();
	const { lat, lon, display_name } = data[0];
	return { lat, lon, display_name };
}

async function CoordToCity(coord) {
	const url = `https://geocode.maps.co/reverse?lat=${coord.lat}&lon=${coord.lon}`;
	var res = await fetch(url);
	const data = await res.json();
	const {
		address: { city },
	} = data;
	return city;
}

function formatData(adhanData) {
	const month = new Date().getMonth() + 1;
	const day = new Date().getDate() - 1;
	const { timings, date } = adhanData.data[month][day];
	const { Fajr, Dhuhr, Asr, Maghrib, Isha } = timings;
	const pryerTime = [Fajr, Dhuhr, Asr, Maghrib, Isha];
	return { date, pryerTime };
}

function convertTimeToNumber(time) {
	const [hrs, min] = time.split(":");
	const number = Number(`${hrs}.${min}`);
	return number;
}

function prepareNextPryer(currentHrs, currentMin, pryerTime) {
	const formatMin = currentMin < 10 ? `0${currentMin}` : currentMin;
	const currentTime = Number(`${currentHrs}.${formatMin}`);
	const time = pryerTime[pryerTime.length - 1].split(" ")[0];
	const nightTime = convertTimeToNumber(time);
	return { currentTime, nightTime, pryerTime };
}

function getNextPryer(currentTime, nightTime, pryerTime) {
	if (currentTime > nightTime) {
		return pryerTime[0];
	} else {
		for (let i = 0; i < pryerTime.length; i++) {
			const time = pryerTime[i].split(" ")[0];
			const iterationTime = convertTimeToNumber(time);
			if (iterationTime > currentTime) return pryerTime[i];
		}
	}
}

function manageData(adhanData) {
	const { date, pryerTime } = formatData(adhanData);
	const currentHrs = new Date().getHours();
	const currentMin = new Date().getMinutes();
	const { currentTime, nightTime } = prepareNextPryer(
		currentHrs,
		currentMin,
		pryerTime
	);
	const next = getNextPryer(currentTime, nightTime, pryerTime);
	return { date, pryerTime, next };
}

function displayData(adhanData, city) {
	const { date, pryerTime, next } = manageData(adhanData);
	$$(".result .times .time").each(function (i) {
		$$(this).text(pryerTime[i]);
		if ($$(this)[0].innerHTML == next) $$(this).parent().addClass("next");
	});
	$$(".date").text(date.readable);
	$$(".city").text(city);
	$$(".loading").remove();
}

function outputTheData() {}

async function handleFetchData(cityName, coords, year, method) {
	try {
		const adhanData = await getAdhanTime(coords, year, method);
		displayData(await adhanData.json(), cityName);
	} catch (error) {
		const time = setInterval(async () => {
			const adhanData = await getAdhanTime(coords, year, method);
			if (adhanData.ok == true) {
				clearInterval(time);
				displayData(await adhanData.json(), cityName);
			}
		}, 5000);
	}
}

function preloading() {
	const preloader = `<div class="loading">
								<img src="./img/favicon-32x32.png" alt="" />
								<p>loading</p>
							</div>`;
	$$(".wrapper").prepend(preloader);
}

async function handleInput(year, method) {
	const cityName = $$("#search-input").val();
	coords = await cityToCoord(cityName);
	handleFetchData(cityName, coords, year, method);
}

async function getAdhanTime(coords, year, method) {
	const { lat, lon } = coords;
	const baseUrl = "https://api.aladhan.com/v1/calendar";
	const url = `${baseUrl}/${year}?latitude=${lat}&longitude=${lon}&method=${method}`;
	const res = await fetch(url);
	return res;
}
