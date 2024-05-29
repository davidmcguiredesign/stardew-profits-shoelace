// Prepare variables.
var cropList;

var options;
var MAX_INT = Number.MAX_SAFE_INTEGER || Number.MAX_VALUE;

/**
 * Calculates the maximum number of harvests for a crop, specified days, season, etc.
 * @param cropID The ID of the crop to calculate. This corresponds to the crop number of the selected season.
 * @return Number of harvests for the specified crop.
 */
function harvests(cropID) {
	var crop = seasons[options.season].crops[cropID];
	var fertilizer = fertilizers[options.fertilizer];
	// Tea blooms every day for the last 7 days of a season
	var isTea = crop.name == "Tea Leaves";

	// if the crop is NOT cross season, remove 28 extra days for each extra season
	var remainingDays = options.days - 28;
	if (options.crossSeason && options.season != 4) {
        var i = options.season + 1;
        if (i >= 4)
            i = 0;
		for (var j = 0; j < seasons[i].crops.length; j++) {
			var seasonCrop = seasons[i].crops[j];
			if (crop.name == seasonCrop.name) {
				remainingDays += 28;
				break;
			}
		}
	}
    else {
        remainingDays = options.days;
    }

	let harvests = harvests_pure(1, crop.growth.initial * (fertilizer.growth - (options.skills.agri ? 0.1 : 0)));

	// console.log("Harvests: " + harvests);
	return harvests;
}

/**
 * @param {number} date The current date
 * @param {number} initialGrowth The initial growth of the crop, _with fertilizer applied_.
 * @param {number} regrowth The time it takes the crop to regrow
 * @param {number} endOfSeason The last day the crop can grow
 */
function harvests_pure(date, initialGrowth, regrowth, endOfSeason) {
	let harvests = 0;
	date += initialGrowth;

	do {
		if (!isTea && date < endOfSeason) harvests++;

		// Mature tea is harvestable the last 7 days of a season.
		else if (21 < (date-1) % 28 + 1) harvests++;

		date += regrowth;
		
	} while (date < endOfSeason);

	return harvests;
}

/**
 * Calculates the minimum cost of a single packet of seeds.
 * @param crop The crop object, containing all the crop data.
 * @return The minimum cost of a packet of seeds, taking options into account.
 */
function minSeedCost(crop) {
	var minSeedCost = Infinity;

	if (crop.seeds.pierre != 0 && options.seeds.pierre && crop.seeds.pierre < minSeedCost)
		minSeedCost = crop.seeds.pierre;
	if (crop.seeds.joja != 0 && options.seeds.joja && crop.seeds.joja < minSeedCost)
		minSeedCost = crop.seeds.joja;
	if (crop.seeds.special != 0 && options.seeds.special && crop.seeds.special < minSeedCost)
		minSeedCost = crop.seeds.special;
	
	return minSeedCost;
}

/**
 * Calculates the number of crops planted.
 * @param crop The crop object, containing all the crop data.
 * @return The number of crops planted, taking the desired number planted and the max seed money into account.
 */
function planted(crop) {
	if (options.buySeed && options.maxSeedMoney !== 0) {
		return Math.min(options.planted, Math.floor(options.maxSeedMoney / minSeedCost(crop)));
	} else {
		return options.planted;
	}
}

/**
 * Calculates the ratios of different crop ratings based on fertilizer level and player farming level
 * Math is from Crop.harvest(...) game logic
 *
 * @param fertilizer The level of the fertilizer (none:0, basic:1, quality:2, deluxe:3)
 * @param level The total farming skill level of the player
 * @return Object containing ratios of iridium, gold, silver, and unrated crops liklihood
 */
function levelRatio(fertilizer, level, isWildseed) {
	var ratio = {};

    if (isWildseed) {
		// All wild crops are iridium if botanist is selected
		if  (options.skills.botanist)
        	ratio.ratioI = 1;
		else
			ratio.ratioI = 0;
		// Gold foraging is at a rate of foraging level/30 (and not iridium)
		ratio.ratioG = level/30.0*(1-ratio.ratioI);
		// Silver is at a rate of foraging level/15 (and not gold or iridium)
		ratio.ratioS = level/15.0*(1-ratio.ratioG-ratio.ratioI);
		// Normal is the remaining rate
		ratio.ratioN = 1-ratio.ratioS-ratio.ratioG-ratio.ratioI;
	}
    else
	{
		// Iridium is available on deluxe fertilizer at 1/2 gold ratio
    	ratio.ratioI = fertilizer >= 3 ? (0.2*(level/10.0)+0.2*fertilizer*((level+2)/12.0)+0.01)/2 : 0;
		// Calculate gold times probability of not iridium
		ratio.ratioG = (0.2*(level/10.0)+0.2*fertilizer*((level+2)/12.0)+0.01)*(1.0-ratio.ratioI);
		// Probability of silver capped at .75, times probability of not gold/iridium
		ratio.ratioS = Math.max(0,Math.min(0.75,ratio.ratioG*2.0)*(1.0-ratio.ratioG-ratio.ratioI));
		// Probability of not the other ratings
		ratio.ratioN = Math.max(0, 1.0 - ratio.ratioS - ratio.ratioG - ratio.ratioI);
	}
	return ratio;
}

/**
 * Calculates the gross income for a specified crop.
 * @param {object} crop The crop object, containing all the crop data.
 * @return {object} Object containing sell price (not profit), taking options into amount
 */
function profit(crop) {
	var num_planted = planted(crop);
	var total_harvests = crop.harvests * num_planted;
	var fertilizer = fertilizers[options.fertilizer];
	var produce = options.produce;

    var useLevel = options.level;
    if (crop.isWildseed)
        useLevel = options.foragingLevel;

	var {ratioN, ratioS, ratioG, ratioI} = levelRatio(fertilizer.ratio, useLevel+foods[options.food].level, crop.isWildseed);
        
	if (crop.name == "Tea Leaves") ratioN = 1, ratioS = ratioG = ratioI = 0;
	var profit = 0;
	
	//Skip keg/jar calculations for ineligible crops (where corp.produce.jar or crop.produce.keg = 0)
	
	var userawproduce = false;
	
	switch(produce) {
		case 0:	userawproduce = true; break; 
		case 1: 
			if(crop.produce.jarType == null) userawproduce = true;
			break;
		case 2:
			if(crop.produce.kegType == null) userawproduce = true;
			break;
	}
	
	// console.log("Calculating raw produce value for: " + crop.name);

	if (produce == 0 || userawproduce) {
		profit += crop.produce.price * ratioN * total_harvests;
		profit += Math.trunc(crop.produce.price * 1.25) * ratioS * total_harvests;
		profit += Math.trunc(crop.produce.price * 1.5) * ratioG * total_harvests;
		profit += crop.produce.price * 2 * ratioI * total_harvests;
		// console.log("Profit (After normal produce): " + profit);

		if (crop.produce.extra > 0) {
			profit += crop.produce.price * crop.produce.extraPerc * crop.produce.extra * total_harvests;
			// console.log("Profit (After extra produce): " + profit);
		}

		if (options.skills.till) {
			profit *= 1.1;
			// console.log("Profit (After skills): " + profit);
		}
	}
	else {
		var items = total_harvests;
		items += crop.produce.extraPerc * crop.produce.extra * total_harvests;
		var kegModifier = crop.produce.kegType === "Wine" ? 3 : 2.25;

		switch (produce) {
			case 1: profit += items * (crop.produce.price * 2 + 50); break;
			case 2: profit += items * (crop.produce.keg != null ? crop.produce.keg : crop.produce.price * kegModifier); break;
		}
	}

	return profit;
}

/**
 * Calculates the loss to profit when seeds are bought.
 * @param crop The crop object, containing all the crop data.
 * @param {Number} crop.harvests
 * @param {Number} crop.growth.regrow
 * 
 * @return The total loss.
 */
function seedLoss(crop) {
	var harvests = crop.harvests;

    var loss = -minSeedCost(crop);

	if (crop.growth.regrow == 0 && harvests > 0)
		loss = loss * harvests;

	return loss * planted(crop);
}

/**
 * Calculates the loss to profit when fertilizer is bought.
 *
 * Note that harvesting does not destroy fertilizer, so this is
 * independent of the number of harvests.
 *
 * @param crop The crop object, containing all the crop data.
 * @return {number} The total loss.
 */
function fertLoss(crop) {
	var loss;
	if(options.fertilizer == 4 && options.fertilizerSource == 1)
		loss = -fertilizers[options.fertilizer].alternate_cost;
	else
		loss = -fertilizers[options.fertilizer].cost;
	return loss * planted(crop);
}

/**
 * Converts any value to the average per day value.
 * @param value The value to convert.
 * @return Value per day.
 */
function perDay(value) {
	return value / options.days;
}

/**
 * Performs filtering on a season's crop list, saving the new list to the cropList array.
 */
function fetchCrops() {
	cropList = [];

	var season = seasons[options.season];

	for (var i = 0; i < season.crops.length; i++) {
	    if ((options.seeds.pierre && season.crops[i].seeds.pierre != 0) ||
	    	(options.seeds.joja && season.crops[i].seeds.joja != 0) ||
	    	(options.seeds.special && season.crops[i].seeds.special != 0)) {
	    	cropList.push(JSON.parse(JSON.stringify(season.crops[i])));
	    	cropList[cropList.length - 1].id = i;
		}
	}
}

/**
 * Calculates all profits and losses for all crops in the cropList array.
 */
function valueCrops() {
	for (const i in cropList) {
        if (cropList[i].isWildseed && options.skills.gatherer) {
            cropList[i].produce.extra += 1;
            cropList[i].produce.extraPerc += 0.2;
        }
		cropList[i].planted = planted(cropList[i]);
		cropList[i].harvests = harvests(cropList[i].id);
		cropList[i].seedLoss = seedLoss(cropList[i]);
		cropList[i].fertLoss = fertLoss(cropList[i]);
		cropList[i].profitData = profit(cropList[i]);
		cropList[i].profit = cropList[i].profitData.profit;
		cropList[i].averageProfit = perDay(cropList[i].profit);
		cropList[i].averageSeedLoss = perDay(cropList[i].seedLoss);
		cropList[i].averageFertLoss = perDay(cropList[i].fertLoss);
		if (options.average) {
			cropList[i].drawProfit = cropList[i].averageProfit;
			cropList[i].drawSeedLoss = cropList[i].averageSeedLoss;
			cropList[i].drawFertLoss = cropList[i].averageFertLoss;
		}
		else {
			cropList[i].drawProfit = cropList[i].profit;
			cropList[i].drawSeedLoss = cropList[i].seedLoss;
			cropList[i].drawFertLoss = cropList[i].fertLoss;
		}
	}
}

/**
 * Sorts the cropList array, so that the most profitable crop is the first one.
 */
function sortCrops() {
	var swapped;
    do {
        swapped = false;
        for (var i = 0; i < cropList.length - 1; i++) {
            if (cropList[i].drawProfit < cropList[i + 1].drawProfit) {
                var temp = cropList[i];
                cropList[i] = cropList[i + 1];
                cropList[i + 1] = temp;
                swapped = true;
            }
        }
    } while (swapped);


	// console.log("==== SORTED ====");
	for (var i = 0; i < cropList.length; i++) {
		// console.log(cropList[i].drawProfit.toFixed(2) + "  " + cropList[i].name);
	}
}