/**
 * A function for storing and retrieving arbitrary values, with optional getters and/or setters.
 * 
 * @param {string} key The value identifier.
 * @param {*} value Useful for caching state. Leave undefined to retrieve cache.
 * @param {CallableFunction} getter A pure function that modifies the cached value when retrieving it.
 * @param {CallableFunction} setter A pure function that modifies the value when caching it.
 * @returns The value (run through the getter function if defined), or the result of an assignment operation.
 */
function cache(key, value, getter, setter) {
	if (this.cache === undefined) {
		this.cache = {};
	}

	if (this.cache[key] === undefined) {
		this.cache[key] = { value };
	}

	if (getter !== undefined) {
		this.cache[key].getter = getter;
	}

	if (setter !== undefined) {
		this.cache[key].setter = setter;
	} 

	if (value === undefined) {
		let getter = this.cache[key].getter;
		// fallback architecture allows for redefinition
		if (!getter) getter =(val)=> val;
		return getter(this.cache[key].value);
	}
	
	if (value !== undefined) {
		let setter = this.cache[key].setter;
		// fallback architecture allows for redefinition
		if (!setter) setter =(val)=> val;
		return this.cache[key].value = setter(value);
	}
}

cache('ratio', ()=> {
	
})

class Crop {

	extra() {
		return this.produce.extraPerc * this.produce.extra
	}

	ratio() {
		if (this.name == "Tea Leaves") return { n: 1, s: 0, g: 0, i: 0 }
		if (this.isWildseed) return cache('wildRatio');
		return cache('ratio');
	}

	cost() {
		let min = Infinity;
		let seeds = cache('seeds');

		for (let src of ['pierre', 'joja', 'special']) {
			if (this.seeds[src]!=0 && seeds[src] && this.seeds[src] < min)
			min = this.seeds[src];
		}

		return min;
	}

	harvests() {
		let planted = cache('planted');
		if (!cache('buySeed')) return planted;

		let availableMoney = cache('maxSeedMoney');
		if (!maxSeedMoney) return planted;

		return Math.min( planted, ~~(availableMoney / this.cost()) );
	}

	sell_raw() {
		let ratio = cache('ratio');
		let price = this.produce.price;
		let gross = 0;
		gross += (ratio.n + this.extra()) * ~~(price * 1);
		gross += ratio.s * ~~(price * 1.25);
		gross += ratio.g * ~~(price * 1.5);
		gross += ratio.i * ~~(price * 2);

		// Due to the way fertilizer works with crops like blueberies that drop more than one, crop count must be embedded in the sell functions.
		return gross * this.harvests() * (cache('tillerSkill') ? 1.1 : 1);
	}

	sell_jar() {
		// See note on crop count in this.sell_raw().
		let gross = this.harvests() + this.extra() * this.harvests();
		gross *= this.produce.price * 2 + 50;

		return gross * (cache('artiSkill') ? 1.4 : 1);
	}
	
	sell_keg() {
		let kegModifier = this.produce.kegType === "Wine" ? 3 : 2.25;
		// See note on crop count in this.sell_raw().
		let gross = this.harvests() + this.extra() * this.harvests();
		if (this.produce.keg != null) gross *= this.produce.keg;
		else gross *= this.produce.price * kegModifier;
	}

	sell() {
		let produce = cache('produce');
		if (produce==1 && this.produce.jarType) {
			return this.sell_jar();
		}
		if (produce==2 && this.produce.kegType) {
			return this.sell_keg();
		}
		return this.sell_raw();
	}
}