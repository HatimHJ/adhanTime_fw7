// not tested....
function getNotification(interval) {
	setInterval(() => {
		myApp.addNotification({
			title: "adhanTime",
			message: "It's adhan time",
		});
	}, interval);
}

// iterval = time between to pryer  in ms
function displayRemainingTime(interval) {
	let time = interval;
	intervalID = setInterval(() => {
		const { hh, mm, ss } = remainingTime(time);
		$$(".remaining-time").text(`${hh}:${mm}:${ss}`);
		time -= 1000;
	}, 1000);
}

// iterval = current time in ms
function displayCurrentTime() {
	setInterval(() => {
		let time = new Date();
		let hh = time.getHours();
		let mm = time.getMinutes();
		let ss = time.getSeconds();
		$$(".current-time").text(`${hh}:${mm}:${ss}`);
	}, 1000);
}

function remainingTime(msec) {
	const hh = Math.floor(msec / 1000 / 60 / 60);
	msec -= hh * 1000 * 60 * 60;
	const mm = Math.floor(msec / 1000 / 60);
	msec -= mm * 1000 * 60;
	const ss = Math.floor(msec / 1000);
	msec -= ss * 1000;
	return { hh, mm, ss };
	// $$(".remaining-time").text(`${hh}:${mm}:${ss}`);
}

async function cityToCoord(city) {
	const url = "https://geocode.maps.co/search?q=" + city;
	var res = await fetch(url);
	const data = await res.json();
	const { lat, lon, display_name } = data[0];
	return { lat, lon, display_name };
}

async function CoordToCity(coord) {
	console.log("CoordToCity");
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
	if (time.includes(" ")) time = time.split(" ")[0];
	const [hrs, min] = time.split(":");
	const number = Number(`${hrs}.${min}`);
	return number;
}

function getHrsAndMin(time) {
	const sep = time.toString()[2]; //very risky [. || :]
	let timeString = time.toString();
	if (timeString.includes(" ")) timeString = timeString.split(" ")[0];

	const [hrs, min] = timeString.split(sep);
	return [hrs, min];
}

function prepareNextPryer(currentHrs, currentMin, pryerTime) {
	const formatMin = currentMin < 10 ? `0${currentMin}` : currentMin;
	const currentTime = Number(`${currentHrs}.${formatMin}`);
	const time = pryerTime[pryerTime.length - 1].split(" ")[0];
	const nightTime = convertTimeToNumber(time);
	return { currentTime, nightTime, pryerTime };
}

function getNextPryer(currentTime, nightTime, pryerTime) {
	if (currentTime > nightTime) return pryerTime[0];
	for (let i = 0; i < pryerTime.length; i++) {
		const time = pryerTime[i].split(" ")[0];
		const iterationTime = convertTimeToNumber(time);
		if (iterationTime > currentTime) return pryerTime[i];
	}
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

// not tested....
function counter(current, next) {
	const month = new Date().getMonth() + 1;
	const day = new Date().getDate() - 1;
	const year = new Date().getFullYear();
	const currentTime = getHrsAndMin(current);
	const nextTime = getHrsAndMin(next);
	const currnetMoment = new Date(
		`${month}/${day}/${year} ${currentTime[0]}:${currentTime[1]}`
	).getTime();
	console.log(currnetMoment);
	const nextPryer = new Date(
		`${month}/${day}/${year} ${nextTime[0]}:${nextTime[1]}`
	).getTime();
	const interval = nextPryer - currnetMoment;
	return { currnetMoment, interval };
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

function displayData(adhanData, city) {
	const { date, pryerTime, next, currentTime } = manageData(adhanData);
	$$(".result .times .time").each(function (i) {
		$$(this).text(pryerTime[i]);
		$$(this).parent().removeClass("next");
		if ($$(this)[0].innerHTML == next) $$(this).parent().addClass("next");
	});
	$$(".date").text(date.readable);
	$$(".city").text(city);
	$$(".loading").remove();
	return { currentTime, next };
}

// time 12.43
function getMsFromTime(time) {}

async function printData(adhanData, cityName) {
	const { currentTime, next } = displayData(await adhanData.json(), cityName);
	const { interval, currnetMoment } = counter(currentTime, next);
	console.log(currentTime);
	getNotification(interval);
	displayRemainingTime(interval);
	console.log(currnetMoment);
	displayCurrentTime(currnetMoment);
}

async function handleFetchData(coords, year, method, cityName) {
	try {
		const adhanData = await getAdhanTime(coords, year, method);
		if (adhanData.ok == true) {
			printData(adhanData, cityName);
		}
	} catch (error) {
		const time = setInterval(async () => {
			const adhanData = await getAdhanTime(coords, year, method);
			if (adhanData.ok == true) {
				clearInterval(time);
				printData(adhanData, cityName);
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
	// clear interval...
	handleFetchData(coords, year, method, cityName);
}

async function getAdhanTime(coords, year, method) {
	const { lat, lon } = coords;
	const baseUrl = "https://api.aladhan.com/v1/calendar";
	const url = `${baseUrl}/${year}?latitude=${lat}&longitude=${lon}&method=${method}`;
	const res = await fetch(url); //429
	return res;
}

function getYearAndMethod() {
	const defaultYear = new Date().getFullYear().toString();
	const defaultMethod = "4";
	const storedYear = localStorage.getItem("year");
	const storedMethod = localStorage.getItem("method");
	const year = storedYear ? storedYear : defaultYear;
	const method = storedMethod ? storedMethod : defaultMethod;
	return { year, method };
}
