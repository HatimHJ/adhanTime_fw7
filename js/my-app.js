var $$ = Dom7;

var intervalID;
$$(document).on("pageInit", function (e) {
	if (e.detail.page.name === "index") {
		const { year, method } = getYearAndMethod();
		navigator.geolocation.getCurrentPosition(
			(pos) => init(pos.coords.latitude, pos.coords.longitude, year, method),
			() => init(21.51694, 39.21917, year, method)
		);

		$$("#search-btn").on("click", () => {
			preloading();
			if (intervalID) {
				clearInterval(intervalID);
			}
			handleInput(year, method);
			// const interval = counter(currentTime, next);
			// getNotification(interval);
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

async function init(lat, lon, year, method) {
	const coords = { lat, lon };
	const cityName = await CoordToCity(coords);
	handleFetchData(coords, year, method, cityName);

	// const interval = counter(currentTime, next);
	// getNotification(interval);
}
