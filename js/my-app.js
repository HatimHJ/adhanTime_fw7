var $$ = Dom7;
var coords;

async function getAdhanTime(coords) {
	const { lat, lon } = coords;
	const year = new Date().getFullYear().toString();
	const method = "4";
	const baseUrl = "https://api.aladhan.com/v1/calendar";
	const url = `${baseUrl}/${year}?latitude=${lat}&longitude=${lon}&method=${method}`;
	const res = await fetch(url);
	console.log(res);
	return res;
}

$$(document).on("pageInit", function (e) {
	if (e.detail.page.name === "index") {
		navigator.geolocation.getCurrentPosition(async (pos) => {
			coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
			const cityName = await CoordToCity(coords);
			handleFetchData(cityName, coords);
		});

		$$("#search-btn").on("click", async function () {
			handleInput();
		});
		$$("#search-input").on("keyup", async function (e) {
			// todo
		});
	}
});

// Initialize your app
var myApp = new Framework7();

// Add view
var mainView = myApp.addView(".view-main", {
	dynamicNavbar: true,
});

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

function displayData(adhanData, city) {
	const month = new Date().getMonth() + 1;
	const day = new Date().getDate() - 1;
	const { timings, date } = adhanData.data[month][day];
	const { Fajr, Dhuhr, Asr, Maghrib, Isha } = timings;
	const pryerTime = [Fajr, Dhuhr, Asr, Maghrib, Isha];
	$$(".result .times .time").each(function (i) {
		$$(this).text(pryerTime[i]);
	});
	$$(".date").text(date.readable);
	$$(".city").text(city);
	$$(".loading").remove();
}

async function handleFetchData(cityName, coords) {
	try {
		const adhanData = await getAdhanTime(coords);
		displayData(await adhanData.json(), cityName);
	} catch (error) {
		const time = setInterval(async () => {
			const adhanData = await getAdhanTime(coords);
			if (adhanData.ok == true) {
				clearInterval(time);
				displayData(await adhanData.json(), cityName);
			}
		}, 5000);
	}
}

async function handleInput() {
	const preloader = `<div class="loading">
								<img src="./img/favicon-32x32.png" alt="" />
								<p>loading</p>
							</div>`;
	$$(".wrapper").prepend(preloader);
	const cityName = $$("#search-input").val();
	coords = await cityToCoord(cityName);
	handleFetchData(cityName, coords);
}
