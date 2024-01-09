/* In order to make this system work, each function would need its own cache of previous results. Speed & great stability at the price of memory. */

function emit(eventName, data) {
	document.dispatchEvent(
		new CustomEvent(eventName, {detail:data})
	);
}

function create(listen, callback, emit) {
	document.addEventListener(listen, (e)=> {
		let result = callback(e);
		emit(emit, result);
	});
}

function harvests(crop, seasonLength, currentDay) {
	const isTea = crop.name == 'Tea Leaves';
	const remaining = Math.min(seasonLength, crop.seasonLength);

	crop.harvests = 0;
	let day = currentDay + crop.initial;

	do {
		if (!isTea && day <= remaining) crop.harvests++;
		else if (21 < (day-1) % 28 + 1) crop.harvests++;
		day += crop.growth.regrow;
	} while (day <= remaining);

	return crop;
}

create('fertilizer-changed', (event)=> {
	const crop = event.detail.crop;
	crop.growth.initial = ~~(crop.growth.initial + options.fertilizer.growth);
	crop.growth.regrow = crop.growth.regrow || initial;
	return crop;
}, 'growth-changed');

create('growth-changed', (event)=> {
	const crop = event.detail.crop;
	const seasonLength = options.seasonLength;
	const currentDay = options.day;
	return harvests(crop, seasonLength, currentDay);
}, 'harvests-changed');

create('season-length-changed', (event)=> {
	const crop = event.detail.crop;
	const seasonLength = options.seasonLength;
	const currentDay = options.day;
	return harvests(crop, seasonLength, currentDay);
}, 'harvests-changed');

create('seed-sources-changed', (event)=> {
	const crop = event.detail.crop;
	crop.seeds.price = Infinity;
	for (const src of ['pierre', 'joja', 'special']) {
		if (crop.seeds[src] == 0) continue;
		if (!options.seeds[src]) continue;
		if (crop.seeds[src] >= crop.seeds.price) continue;
		crop.seeds.price = crop.seeds[src];
	}
	return crop;
}, 'seed-price-changed');

function fertilizer(fertilizerData, options) {
	const fertilizer = fertilizerData[options.fertId];
	if (options.agri) fertilizer.growth -= 0.1;
	return fertilizer;
}

function bar(cropData, options) {}