/* IDE Hints */

class CropSeeds
{
	pierre = 0;
	joja = 0;
	special = 0;
	specialLoc = "";
	specialUrl = "";

	constructor({...data}) {
		for (const p in data) this[p] = data[p];
		return this;
	}
}

class CropGrowth
{
	initial = 0;
	regrow = 0;

	constructor({...data}) {
		for (const p in data) this[p] = data[p];
		return this;
	}
}

class CropProduce
{
	extra = 0;
	extraPerc = 0;
	price = 0;
	jarType = "";
	kegType = "";

	constructor({...data}) {
		for (const p in data) this[p] = data[p];
		return this;
	}
}

class Crop
{
	static library = new Map();

	name = "";
	url = "";
	img = "";
	isWildseed = false;
	plantableDays = 28;

	get plantableDays() {
		if (options.season == 4) return 28 * 4;
		return seasons[options.season].duration;
		// #TODO: check whether crop extends to next season
	}

	/** @var {CropSeeds} seeds */
	seeds;
	/** @var {CropGrowth} growth */
	growth;
	/** @var {CropProduce} produce */
	produce;

	constructor({name, ...data}) {
		if (Crop.library.has(name)) {
			console.log(name+" Crop instance already exists.");
			return Crop.library.get(name);
		} else {
			console.log("creating Crop instance "+name);
		}

		this.name = name;
		this.url = data.url;
		this.img = data.img;
		if (data.isWildseed) this.isWildseed = true;
		this.seeds = new CropSeeds(data.seeds);
		this.growth = new CropGrowth(data.growth);
		this.produce = new CropProduce(data.produce);

		Crop.library.set(name, this);
		return this;
	}

	harvests(days, season, fertilizer, produce) {
		days -= this.growth.initial;
		if (produce == 1) days -= 4000 / 1600;
		else if (produce == 2) days -= 7;
		return Math.floor(days / this.growth.regrow);
	}

	sell() {
		let level = options[this.isWildseed ? 'level' : 'foragingLevel'];
	}
}