function subStyle(element, key, value) {
	let existing = element.getAttribute('style') || '';
	if (existing.includes(key)) {
		existing.replace(`/(?<=${key}:)[^;]+(?=;)/g`, value);
	} else {
		existing += `${key}:${value};`;
	}
	element.setAttribute('style', existing);

	return element;
}

const bars = new Map();

function bar(cropName) {
	if (bars.has(cropName)) return bars.get(cropName);

	const bar = document.createElement('div');
	bar.classList.add('bar');

	for (let type of ['fert', 'seed', 'loss', 'profit', 'sell']) {
		let part = document.createElement('div');
		part.classList.add(type);
		bar.append(part);
	}

	bar.seed =(value)=> subStyle(bar, '--seed', value);
	bar.sell =(value)=> subStyle(bar, '--sell', value);

	document.getElementById('chart').append(bar);
	bars.set(cropName, bar);

	return bar;
}

function axis() {
	if (bars.has('axis')) return bars.get(axis);
	
	const axis = document.getElementById('axis');

	// get range

	// determine how many tics are readable
	axis._precision =()=> 20;

	axis._increment =(range)=> {
		let maxSteps = axis._precision();
		let scale = 1;
		let increments = [5, 10, 20, 25];
		while (range / (increments[0] * scale) > maxSteps) {
			increments.push(increments.shift());
			if (increments[0] == 5) scale *= 10;
		}
		return increments[0] * scale;
	}

	// set axis limits
	axis.min = 0;
	axis.max = 0;

	axis.ceiling =(newValue)=> {
		let increment = axis._increment(newValue - axis.min);
		let limit = 0;
		while (limit < newValue) limit += increment;

		return steps;
	}

	axis.floor =(newValue)=> {
		let increment = -1 * axis._increment(axis.max - newValue);
		let limit = 0;
		while (newValue < limit) limit += increment;

		return steps;
	}

	return axis;
}

// for (let crop of activeCrops) {
// 	let bar = bar(crop.name);
// 	bar.seed(crop.seed);
// 	bar.sell(crop.sell);
// 	if (bar.max > axis().max) axis.ceiling(bar.max);
// 	if (bar.min < axis().min) axis.floor(bar.min);
// } 