/**
 * @typedef {object} RawCrop
 * @prop {string} name
 * @prop {string} url
 * @prop {string} img The crop favicon
 * @prop {number} seeds.pierre The cost of seeds at Pierre's General Store, or 0 if unavailable
 * @prop {number} seeds.joja The cost of seeds at JojaMart, or 0 if unavailable
 * @prop {number} seeds.special The cost of seeds at another vendor, or 0 if not applicable
 * @prop {string} seeds.specialLoc ?
 * @prop {string} seeds.specialUrl ?
 * @prop {number} growth.initial The time until first harvest
 * @prop {number} growth.regrow The time from first harvest to second harvest, or 0 if not applicable
 * @prop {number} produce.extra The quantity of items harvested, minus the assumed 1
 * @prop {number} produce.extraPerc
 * @prop {number} produce.price The money received from selling 1 item at normal quality (prices of higher qualities also based on this)
 * @prop {string} produce.jarType Name of item type produced by jar
 * @prop {string} produce.kegType Name of item type produced by keg
 * @prop {number} plantableDays A pre-computed value that varies for a given crop from season to season, depending on whether it can be grown in the following season 
 */

/**
 * Given a crop object and a configuration of options, return an edited crop object.
 * 
 * @param {RawCrop} cropData Static crop properties
 * @param {Options} options Global options store
 * @returns {FullCrop}
 */
function crop(cropData, options) {
	cropData.growth.initial = ~~(cropData.growth.initial * options.fertilizer());
	if (!cropData.growth.regrow) cropData.growth.regrow = cropData.growth.initial;

	cropData.harvests = 0;
	let day = cropData.growth.initial;
	let remaining = Math.min(options.seasonLength, cropData.plantableDays)

	let isTea = cropData.name == "Tea Leaves";

	do {
		if (!isTea && day <= remaining) cropData.harvests++;
		else if (21 < (day-1) % 28 + 1) cropData.harvests++;
		day += cropData.growth.regrow
	} while (day <= remaining);

	cropData.seeds.price = Infinity;
	for (const src of ['pierre', 'joja', 'special']) {
		if (cropData.seeds[src] == 0) continue;
		if (!options.seeds[src]) continue;
		if (cropData.seeds[src] >= cropData.seeds.price) continue;
		cropData.seeds.price = cropData.seeds[src];
	}
	
	/** @returns {HTMLElement} */
	cropData.bar =(options)=> bar(cropData, options);

	return cropData;
}

function changeInitialGrowth(crop) {
	
}

create(crop, 'fertilizer-changed', (crop)=> {
	let harvests = 0;
	let initial = ~~(crop.growth.initial + options.fertilizer);
	let regrow = crop.growth.regrow || initial;
	
}, 'growth-changed');

function changeSeedPrice(crop) {
	crop.seeds.price = Infinity;
	for (const src of ['pierre', 'joja', 'special']) {
		if (crop.seeds[src] == 0) continue;
		if (!options.seeds[src]) continue;
		if (crop.seeds[src] >= crop.seeds.price) continue;
		crop.seeds.price = crop.seeds[src];
	}
	return crop;
}

function fertilizer(fertilizerData, options) {
	const fertilizer = fertilizerData[options.fertId];
	if (options.agri) fertilizer.growth -= 0.1;
	return fertilizer;
}

function bar(cropData, options) {}