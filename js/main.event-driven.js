/* 
 * A lightweight event-driven “framework” would decouple a function from its effects while keeping the hyper-optimization of a function chain. No function would run unless needed, and the function definition would decide when it’s needed. But even assuming it can be done simply, there are still some gotchas. 
 * 
 * Does each crop listen only for its own events, or does a Crop class listen and loop through its members at each layer? 
 * 
 * Are the callbacks added and removed when the crop list changes, or will they run on every crop in the library?
 * 
 * What overhead do the event listeners themselves create? It might be non-trivial.
 */

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

run(gross, Crop, 'options_produce');
run(gross, Crop, 'crop_grown');
run(gross, Crop, 'crop_jarPrice');
run(gross, Crop, 'crop_kegPrice');
run(gross, Crop, 'crop_rawPrice');

const Inputs = new Proxy({},{
	set: (storage, property, newValue)=> {
		if (typeof newValue == typeof Function) {
			return storage[property+'_setter'] = newValue;
		}

		const isSet = Reflect.set(storage, property, newValue);
		Reflect[property+'_setter'](newValue);

		return isSet;
	},
	get: (storage, property)=> {
		return Reflect.get(storage, property);
	}
})

Inputs.fert = (fertId)=> {
	Cache.fertGrowth = fertilizers[fertId].growth;
	Cache.fertRatio = fertilizers[fertId].ratio;
	Cache.fertCost = fertilizers[fertId].cost;
}

Cache.fertGrowth = new When( // The parent Proxy allows me to tie a dispatched event to a property of this object.
	{ fert: Inputs, }, // The key:host syntax allows me to tie event listeners and properties of other objects together. 
	({...args})=> {
		EachCrop.harvests(args);
	}
);

// function when({...inputs}, whenSet) {
// 	const setter = ()=> {
// 		for (const key in inputs) {
// 			const host = inputs[property];
// 			inputs[key] = host[key];
// 		}
// 		whenSet(inputs);
// 	}
// 	for (const property in inputs) {
// 		document.addEventListener(a+'_changed', setter);
// 	}
// 	// This doesn’t solve race conditions. 
// }

function when({...dependencies}, callback) {
	// add detectors for the change event
	// each detector 
}

const Cache = new Proxy({},{
	set: (storage, property, newValue)=> {
		const func_key = property + '_whenSet';
		const args_key = property + '_args';

		if (newValue instanceof When) {
			storage[args_key] = newValue.args;

			for (const p in storage[args_key]) {
				document.addEventListener(p+'_changed', ()=> newValue.whenSet() );
			}

			storage[func_key] = ()=> {
				newValue.whenSet();
				emit(property+'_changed');
			}

			return true;
		}

		const args = storage[args_key];
		for (const p in args) {
			args[p] = args[p][p];
		}

	}
})


const EachCrop = new Proxy({}, {
	set: (obj, prop, newValue)=> {
		if (obj['set_'+prop] !== undefined) return obj[prop] = obj['set_'+prop](newValue);

		if (typeof newValue == typeof Function) {
			const details = newValue();

			obj['set_'+prop] = (value)=> {
				details.doThis(value, CropList);
				document.dispatchEvent(new Event(prop+'_changed'));
			}

			for (const eventName of details.onEvents) {
				document.addEventListener(eventName, obj['set_'+prop]);
			}
		} else {
			return Reflect.set(obj, prop, newValue);
		}
	}
});

CropList.wildRatio = ()=> { return {
	doThis: (botanist = Options.bota_skill, level = Options.foraging)=> {
		let ratio = { i: 0, g: 0, s: 0, n: 0 }
		if (botanist) ratio.i = 1;
		ratio.g = level / 30 * (1 - ratio.i);
		ratio.s = level / 15 * (1 - ratio.i - ratio.g);
		ratio.n = 1 - ratio.i - ratio.g - ratio.s;
		return ratio;
	},
	onEvents: ['bota_skill_changed', 'level_foraging_changed']
} }

function setAlt({...tryFirst}, {...thenTry}) {
	return new Proxy(tryFirst, {
		get: (obj, prop)=> {
			let result = Reflect.get(obj, prop);
			if (result !== undefined) return result;
			return Reflect.get(thenTry, prop);
		}
	});
}