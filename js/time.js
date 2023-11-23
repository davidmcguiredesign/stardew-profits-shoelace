var current = "";

/*
 * Changes the website design based on local time.
 */
function styleByTime() {
	var t = new Date();
	var h = t.getHours();
	var temp;
	if (h >= 7 && h < 18)
		temp = "day";
	else
		temp = "night";

	if (temp != current) {
		// console.log("Switching time to " + temp + "!");
		d3.select(".background").style("background-image", `url("img/bg_${temp}.png")`);
		current = temp;
	}

	setTimeout(styleByTime, 1000);
}

styleByTime();