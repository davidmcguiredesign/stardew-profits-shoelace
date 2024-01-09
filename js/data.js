// Options used to draw the graph.
var options = {
	"produce" : 0,
	"planted": 1,
    "maxSeedMoney": 0,
	"seasonLength": 28,
	"fertilizer": 2,
	"level": 0,
	"season": 4,
	"buySeed": false,
	"buyFert": false,
	"average": false,
    "fertilizer": 2,
    "fertilizerSource": 0,
	"seeds": {
		"pierre": true,
		"joja": true,
		"special": true
	},
	"skills": {
		"till": false,
		"agri": false,
		"arti": false
	},
	"food": 0,
	"extra": false
};

// Different fertilizers with their stats.
var fertilizers = [
	{
		"name": "None",
		"ratio": 0,
		"growth": 1,
		"cost": 0
	},
	{
		"name": "Basic Fertilizer",
		"ratio": 1,
		"growth": 1,
		"cost": 100
	},
	{
		"name": "Quality Fertilizer",
		"ratio": 2,
		"growth": 1,
		"cost": 150
	},
	{
		"name": "Speed-Gro",
		"ratio": 0,
		"growth": 0.9,
		"cost": 100
	},
	{
		"name": "Deluxe Speed-Gro",
		"ratio": 0,
		"growth": 0.75,
		"cost": 150,
		"alternate_cost": 80
	},
	{
		"name": "Deluxe Fertilizer",
		"ratio": 3,
		"growth": 1,
		"cost": 0
	},
	{
		"name": "Hyper Speed-Gro",
		"ratio": 0,
		"growth": 0.67,
		"cost": 0
	}
];

var foods = [
	{
		"name": "None",
		"level": 0
	},
	{
		"name": "Maple Bar",
		"level": 1
	},
	{
		"name": "Hashbrowns",
		"level": 1
	},
	{
		"name": "Complete Breakfast",
		"level": 2
	},
	{
		"name": "Pepper Poppers",
		"level": 2
	},
	{
		"name": "Tom Kha Soup",
		"level": 2
	},
	{
		"name": "Farmer's Lunch",
		"level": 3
	}
];

// Different seasons with predefined crops.
var seasons = [
	{
		"name": "Spring",
		"duration": 28,
		"crops": [
			crops.coffeebean,
			crops.strawberry,
			crops.rhubarb,
			crops.potato,
			crops.cauliflower,
			crops.greenbean,
			crops.tealeaves,
			crops.kale,
			crops.unmilledrice,
			crops.garlic,
			crops.parsnip,
			crops.bluejazz,
			crops.tulip,
			crops.ancientfruit,
			crops.springseeds
		]
	},
	{
		"name": "Summer",
		"duration": 28,
		"crops": [
			crops.pineapple,
			crops.blueberry,
			crops.starfruit,
			crops.redcabbage,
			crops.hops,
			crops.melon,
			crops.hotpepper,
			crops.tealeaves,
			crops.tomato,
			crops.radish,
			crops.summerspangle,
			crops.poppy,
			crops.wheat,
			crops.corn,
			crops.coffeebean,
			crops.sunflower,
			crops.ancientfruit,
			crops.taroroot,
			crops.summerseeds
		]
	},
	{
		"name": "Fall",
		"duration": 28,
		"crops": [
			crops.sweetgemberry,
			crops.cranberries,
			crops.pumpkin,
			crops.grape,
			crops.artichoke,
			crops.beet,
			crops.eggplant,
			crops.amaranth,
			crops.yam,
			crops.tealeaves,
			crops.fairyrose,
			crops.bokchoy,
			crops.sunflower,
			crops.wheat,
			crops.corn,
			crops.ancientfruit,
			crops.fallseeds
		]
	},
	{
		"name": "Winter",
		"duration": 28,
		"crops": [
			crops.winterseeds
		]
	},
	{
		"name": "Greenhouse",
		"duration": 112,
		"crops": [
			crops.pineapple,
			crops.coffeebean,
			crops.strawberry,
			crops.rhubarb,
			crops.potato,
			crops.cauliflower,
			crops.greenbean,
			crops.kale,
			crops.unmilledrice,
			crops.garlic,
			crops.parsnip,
			crops.bluejazz,
			crops.tulip,
			crops.blueberry,
			crops.starfruit,
			crops.redcabbage,
			crops.hops,
			crops.melon,
			crops.hotpepper,
			crops.tomato,
			crops.radish,
			crops.summerspangle,
			crops.poppy,
			crops.wheat,
			crops.corn,
			crops.sweetgemberry,
			crops.cranberries,
			crops.pumpkin,
			crops.grape,
			crops.tealeaves,
			crops.artichoke,
			crops.beet,
			crops.eggplant,
			crops.amaranth,
			crops.yam,
			crops.fairyrose,
			crops.bokchoy,
			crops.sunflower,
			crops.ancientfruit,
			crops.cactusfruit,
			crops.taroroot
		]
	}
];

// Attach cross-season data to crop objects
for (let s in seasons) {
	const thisSeason = seasons[s];
	const nextSeason = seasons[s < 3 ? s + 1 : 0];

	for (const crop of thisSeason.crops) {
		crop.plantableDays = thisSeason.duration;

		if (s == 4) continue;
		if (!nextSeason.crops.some(c=> c.name == crop.name)) continue;

		crop.plantableDays += nextSeason.duration;
	}
}