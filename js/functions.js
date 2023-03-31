var intervalID;

function getConfig() {
	const defaultYear = new Date().getFullYear();
	const defaultMethod = "4";
	const storedYear = localStorage.getItem("year");
	const storedMethod = localStorage.getItem("method");
	const year = storedYear ? storedYear : defaultYear;
	const method = storedMethod ? storedMethod : defaultMethod;
	return { year, method };
}

async function CityToCoord(city) {
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
	const { address } = data;
	return address.city;
}

function displayRemainingTime(interval) {
	// iterval = time between to pryer  in ms
	let time = interval;
	intervalID = setInterval(() => {
		const { hh, mm, ss } = msToTime(time);
		$$(".remaining-time").text(`${hh}:${mm}:${ss}`);
		time -= 1000;
	}, 1000);
}

function displayCurrentTime() {
	setInterval(() => {
		let time = new Date();
		let hh = time.getHours();
		let mm = time.getMinutes();
		let ss = time.getSeconds();
		$$(".current-time").text(`${hh}:${mm}:${ss}`);
	}, 1000);
}

function msToTime(msec) {
	const hh = Math.floor(msec / 1000 / 60 / 60);
	msec -= hh * 1000 * 60 * 60;
	const mm = Math.floor(msec / 1000 / 60);
	msec -= mm * 1000 * 60;
	const ss = Math.floor(msec / 1000);
	msec -= ss * 1000;
	return { hh, mm, ss };
}

function formatData(adhanData) {
	const month = new Date().getMonth() + 1;
	const day = new Date().getDate() - 1;
	if (adhanData.code == 200) {
		const { timings, date } = adhanData.data[month][day];
		const { Fajr, Dhuhr, Asr, Maghrib, Isha } = timings;
		const pryerTime = [Fajr, Dhuhr, Asr, Maghrib, Isha];
		return { date, pryerTime };
	}
}

function TimeToNumber(time) {
	if (time.includes(" ")) time = time.split(" ")[0];
	const [hrs, min] = time.split(":");
	const number = Number(`${hrs}.${min}`);
	return number;
}

function getHrsAndMin(time) {
	let timeString = time.toString().replace(/\./, ":");
	if (timeString.includes(" ")) timeString = timeString.split(" ")[0];
	return timeString.split(":");
}

function prepareNextPryer(currentHrs, currentMin, pryerTime) {
	const formatMin = currentMin < 10 ? `0${currentMin}` : currentMin;
	const currentTime = Number(`${currentHrs}.${formatMin}`);
	const time = pryerTime[pryerTime.length - 1].split(" ")[0];
	const nightTime = TimeToNumber(time);
	return { currentTime, nightTime, pryerTime };
}

function getNextPryer(currentTime, nightTime, pryerTime) {
	if (currentTime > nightTime) return pryerTime[0];
	for (let i = 0; i < pryerTime.length; i++) {
		const time = pryerTime[i].split(" ")[0];
		const iterationTime = TimeToNumber(time);
		if (iterationTime > currentTime) return pryerTime[i];
	}
}

function counter(cTime, nextTime) {
	console.log(cTime, nextTime);
	const year = new Date().getFullYear();
	const month = new Date().getMonth() + 1;
	const day = new Date().getDate() - 1;
	const currnetMoment = new Date(
		`${month}/${day}/${year} ${cTime[0]}:${cTime[1]}`
	).getTime();
	const nextPryer = new Date(
		`${month}/${day}/${year} ${nextTime[0]}:${nextTime[1]}`
	).getTime();
	const interval = nextPryer - currnetMoment;
	return interval;
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
	return { date, pryerTime, next, currentTime };
}

function displayData(data, city) {
	const { date, pryerTime, next } = data;
	$$(".result .times .time").each(function (i) {
		$$(this).text(pryerTime[i]);
		$$(this).parent().removeClass("next");
		if ($$(this)[0].innerHTML == next) $$(this).parent().addClass("next");
	});
	$$(".date").text(date.readable);
	$$(".city").text(city);
	$$(".loading").remove();
}

async function handleFetchData(coords, config) {
	try {
		const adhanData = await fetchAdhanTime(coords, config);
		if (adhanData.ok == true) {
			const data = await adhanData.json();
			return data;
		}
	} catch (error) {
		// did not work need fixing
		const data = handleError429(coords, config);
		return data;
	}
}

async function handleError429(coords, config) {
	const intervalId = setInterval(async () => {
		console.log("handleError429 Interval");
		const adhanData = await fetchAdhanTime(coords, config);
		if (adhanData.ok == true) {
			clearInterval(intervalId);
			return await adhanData.json();
		}
	}, 5000);
}

async function fetchAdhanTime(coords, config) {
	const { lat, lon } = coords;
	const { year, method } = config;
	const baseUrl = "https://api.aladhan.com/v1/calendar";
	const url = `${baseUrl}/${year}?latitude=${lat}&longitude=${lon}&method=${method}`;
	const res = await fetch(url); //429
	return res;
}

async function handleInput(config) {
	const cityName = $$("#search-input").val();
	const coords = await CityToCoord(cityName);
	// clear interval...
	const adhanData = await handleFetchData(coords, config);
	return { adhanData, cityName };
}

function addToLocalStorage(data) {
	localStorage.setItem("year", data.year);
	localStorage.setItem("method", data.method);
}

function removeFromLocalStorage() {
	const itemsToRemove = ["year", "method"];
	if (itemsToRemove.length) {
		for (let i = 0; i < itemsToRemove.length; i++)
			localStorage.removeItem(itemsToRemove[i]);
	}
}

function preloading() {
	const preloader = `<div class="loading">
								<img src="./img/favicon-32x32.png" alt="" />
								<p>loading</p>
							</div>`;
	$$(".wrapper").prepend(preloader);
}

function notificationSetup(interval) {
	const id = setInterval(() => {
		myApp.addNotification({
			title: "adhanTime",
			message: "It's adhan time",
		});
	}, interval);
	return id;
}
