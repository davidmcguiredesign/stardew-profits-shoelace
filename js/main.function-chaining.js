/* 
SEQUENCE
options =()
options.date =()=> [crop.harvests]
options.seeds =()=> [crop.minSeedCost]
options.budget =()=> [crop.planted]
options.fert =()=> [crop.harvests, crop.fertLoss]
options.produce =()=> [crop.gross]

cache =()
cache.ratio_tea =()
cache.ratio_wild =(options.level_foraging, options.skills.bota)=> [crop.ratio]
cache.ratio_culti =(options.level_farming, options.fert, options.food)=> [crop.ratio]

crop =()=> [crop.harvests, crop.extra, crop.jarPrice, crop.kegPrice, crop.minSeedCost]
crop.extra =(crop)=> [crop.ratio, crop.grown]
crop.jarPrice =(crop) => [crop.gross]
crop.kegPrice =(crop)=> [crop.gross]
crop.harvests =(options.fert, options.date, crop)=> [crop.planted, crop.grown]
crop.minSeedCost =(options.seeds, crop)=> [crop.planted, crop.seedLoss]
crop.ratio =(cache.ratio_wild, cache.ratio_culti, crop.extra) => [crop.rawPrice]
crop.rawPrice =(crop.ratio)=> [crop.gross]
crop.planted =(options.budget, crop.minSeedCost, crop.harvests)=> [crop.seedLoss, crop.fertLoss, crop.grown]
crop.seedLoss =(crop.planted, crop.minSeedCost)
crop.fertLoss =(options.fert, crop.planted)
crop.grown =(crop.planted, crop.harvests, crop.extra)=> [crop.gross]
crop.gross =(options.produce, crop.grown, crop.jarPrice, crop.kegPrice, crop.rawPrice)
*/

const Options = {};

function on([...eventNames], doThis, onObject, notification) {
	for (const eventName of eventNames) {
		document.addEventListener(eventName, ()=> {
			onObject[doThis]();
			document.dispatchEvent(new Event(notification));
		});
	}
}

function setAlt({...tryFirst}, {...thenTry}) {
	return new Proxy(tryFirst, {
		get: (obj, prop)=> {
			let result = Reflect.get(obj, prop);
			if (result !== undefined) return result;
			return Reflect.get(thenTry, prop);
		}
	});
}

const Cache = {
	fert: {
		cost: 0,
		alternate_cost: 0,
	}
}

/* 
 * This structure would still be problematic because there are still lots of branches in the path. But starting an object's chain behind a branch will automatically trigger the next function _for that object for the current state_, so parts that can be skipped always are. 
 * 
 * Unoptimized point: Changing a keg input causes un-keggable crops to re-calculate.
 */

class Crop {
	static each(property) {
		for (let crop of this.library) {
			crop['set_'+property]();
		}
	}

	/* Basic programming process: start from the end and work upstream. When writing the function for a value that gets called by a function further down the line, call the downstream function at the end of the current (upstream) function. */

	constructor(cropData) {
		this.initialGrowth = cropData.initialGrowth;

		this.produce = {};
		this.produce.price = cropData.produce.price;
		this.produce.kegType = cropData.produce.kegType;
		this.produce.kegPrice = cropData.produce.kegPrice;
		this.produce.keg = cropData.produce.keg;
	}

	planted = 0;
	set_planted(budget = Options.budget) {
		this.set_fertLoss();
	}

	harvests = 0;
	set_harvests(fert = Cache.fert, date = Cache.date, agri = Options.skill_agri) {
		let initial = this.initialGrowth * (fert - (agri ? 0.1 : 0));
		
		let harvests = 0;
		date += initial;
		do {
			if (!this.isTea && date < this.endOfSeason) harvests++;
	
			// Mature tea is harvestable the last 7 days of a season.
			else if (21 < (date - 1) % 28 + 1) harvests++;
	
			date += this.regrowth ? this.regrowth : initial;
			
		} while (date < endOfSeason);
	
		this.harvests = harvests;
		this.set_grossProfit();
	}

	extra = 0;
	set_extra() {
		this.extra = this.produce.extra * this.produce.extraPerc;

		this.set_ratio();
		this.set_harvestProfit();
	}

	static teaRatio = { n: 1, s: 0, g: 0, i: 0 };
	static wildRatio = {};
	static #wildRatio(foraging = Options.level_foraging, botanist = Options.bota) {
		const ratio = {};
		ratio.i = botanist ? 1 : 0;
		ratio.g = foraging / 30 * (1 - ratio.i);
		ratio.s = foraging / 30 * (1 - ratio.i - ratio.g);
		ratio.n = 1 - ratio.i - ratio.g - ratio.s;

		Crop.wildRatio = ratio;
		return ratio;
	}

	/**
	 * jarPrice and kegPrice both give the price for a single item sold, leaving all multi-item and multi-harvest calculations to later functions, so that the item price can be displayed. But raw items don’t all sell for a single value. Even when the ratios are aggregated, fertilizer doesn’t boost the quality of extra items harvested. 
	 * 
	 * Rather than perform different steps for raw items later, I just add `1/grown` at fertilized rate to the rest of `grown` at unfertilized rate, to generate a single number that can be applied to each item harvested.
	 */
	cultiRatio = {};
	#cultiRatio(farming = Options.level_farming, fert = Cache.fertLevel) {
		const ratio = {
			i: 0,
			g: (0.01 + (0.2 * farming * 0.1)) + (0.2 * fert * ((farming + 2) / 12)),
			s: 0,
			n: 0,
		}

		ratio.i = fert >= 3 ? ratio.g / 2 : 0;
		ratio.g *= 1 - ratio.i;
		ratio.s = Math.max(Math.min(ratio.g * 2 * (1 - ratio.i - ratio.g), 0.75), 0);
		ratio.n = 1 - ratio.i - ratio.g - ratio.s;

		if (this.extra) {
			// Fertilizer can only affect the quality of a plant’s first item at harvest.
			const plain = this.#cultiRatio(undefined, 0);
			const fertilized = 1 / (this.extra + 1);
			const unfertilized = 1 - fertilized;

			for (const r in ratio) ratio[r] = (ratio[r] * fertilized) + (plain[r] * unfertilized);
		}

		return ratio;
	}

	ratio = 0;
	set_ratio() {
		if (this.isWildseed) {
			this.ratio = Crop.wildRatio;
		} else if (this.name == 'Tea Leaves') {
			this.ratio = Crop.teaRatio;
		} else {
			this.ratio = this.cultiRatio;
		}
		this.set_rawPrice();
		this.set_harvestProfit();
	}

	/* CALLED BY UPSTREAM THIS */
	rawPrice = 0;
	set_rawPrice() {
		const price = this.produce.price;
		let total = price * this.ratio.n;
		total += Math.trunc(price * 1.25) * this.ratio.s;
		total += Math.trunc(price * 1.5) * this.ratio.g;
		total += price * 2 * this.ratio.i;

		this.rawPrice = total;
		if (produce == 0) this.set_harvestProfit();
	}

	/* NO UPSTREAM THIS */
	jarPrice = 0;
	set_jarPrice(produce = Options.produce, arti = Options.skill_arti) {
		if (!this.produce.jarType) {
			this.jarPrice = 0;
			return;
		}
		
		this.jarPrice = (this.produce.price * 2) + 50;
		if (arti) this.jarPrice *= 1.4;
		if (produce == 1) this.set_harvestProfit();
	}

	/* NO UPSTREAM THIS */
	kegPrice = 0;
	set_kegPrice(produce = Options.produce, arti = Options.skill_arti) {
		if (!this.produce.kegType) {
			this.kegPrice = 0;
			return;
		}

		let price = this.produce.price;
		let modifier = this.produce.kegType == "Wine" ? 3 : 2.25;

		this.kegPrice = this.produce.keg || price * modifier;
		if (arti && this.name !== 'Coffee') this.kegPrice *= 1.4;

		if (produce == 2) this.set_harvestProfit();
	}

	/* CALLED BY UPSTREAM THIS */
	fertLoss = 0;
	set_fertLoss(fert = Options.fert, fert_src = Options.fert_source) {
		if (fert == 4 && fert_src == 1) {
			return -Cache.fert.alternate_cost * this.planted;
		} else {
			return -Cache.fert.cost * this.planted;
		}
	}

	/* CALLED BY UPSTREAM THIS */
	harvestProfit = 0;
	set_harvestProfit(produce = Options.produce) {
		if (produce == 1) {
			this.harvestProfit = this.jarPrice * (this.extra + 1);
		} else if (produce == 2) {
			this.harvestProfit = this.kegPrice * (this.extra + 1);
		} else {
			this.harvestProfit = this.produce.price * this.ratio;
		}

		this.set_grossProfit();
	}

	/* CALLED BY UPSTREAM THIS */
	grossProfit = 0;
	set_grossProfit() {
		this.grossProfit = this.harvestProfit * this.harvests;
	}
}