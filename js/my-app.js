var $$ = Dom7;

/* BUGS
 * 1. remaining time break after asha
 * 2. notifiction need to test
 * 3. ~10s delay between current time & remaining time
 * 4. 429 error handleing broke
 */
$$(document).on("pageInit", function (e) {
	if (e.detail.page.name === "index") {
		// work flow no.1
		const config = getConfig();
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				init(pos.coords.latitude, pos.coords.longitude, config);
			},
			() => {
				init(21.51694, 39.21917, config);
			}
		);
		// work flow no.2
		$$("#search-btn").on("click", async () => {
			preloading();
			if (intervalID) {
				clearInterval(intervalID);
			}
			const { adhanData, cityName } = await handleInput(config);
			controlFlow(adhanData, cityName);
		});
	}
});

// Initialize your app
var myApp = new Framework7();

// config page
myApp.onPageInit("config", () => {
	$$("#submit").on("click", () => {
		const data = myApp.formGetData("my-form");
		addToLocalStorage(data);
		mainView.router.loadPage("index.html");
	});
	$$("#reset").on("click", () => {
		myApp.formDeleteData("my-form");
		removeFromLocalStorage();
		mainView.router.loadPage("index.html");
	});
});
// Add view
var mainView = myApp.addView(".view-main", {
	dynamicNavbar: true,
});

async function init(lat, lon, config) {
	const coords = { lat, lon };
	const cityName = await CoordToCity(coords);
	const adhanData = await handleFetchData(coords, config);
	// the adhanData ready to use
	controlFlow(adhanData, cityName);
}

function controlFlow(adhanData, cityName) {
	const { date, pryerTime, next, currentTime } = manageData(adhanData);
	const data = { date, pryerTime, next };
	displayData(data, cityName);
	const cTime = getHrsAndMin(currentTime);
	const nextTime = getHrsAndMin(next);
	const interval = counter(cTime, nextTime);
	// const id = notificationSetup(interval);
	displayRemainingTime(interval);
	displayCurrentTime();
}
