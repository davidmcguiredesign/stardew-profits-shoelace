function set_cssVariable(element, key, value, prefix='--') {
	let existing = element.getAttribute('style') || '';
	if (existing.includes(key)) {
		let regex = `(?<=${prefix}${key}:)[^;]+(?=;)`;
		existing = existing.replace(new RegExp(regex), value);
	} else {
		existing += `${prefix}${key}:${value};`;
	}
	element.setAttribute('style', existing);

	return element;
}

function get_cssVariable(element, key, prefix='--') {
	let existing = element.getAttribute('style') || '';

	existing = existing.match(new RegExp(`(?<=${prefix}${key}:)[^;]+(?=;)`));
	return existing ? existing[0] : '';
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

	bar.seed =(value)=> set_cssVariable(bar, 'seed', value);
	bar.sell =(value)=> set_cssVariable(bar, 'sell', value);

	document.getElementById('chart').append(bar);
	bars.set(cropName, bar);

	return bar;
}

function axis() {
	if (bars.has('axis')) return bars.get('axis');
	
	const axis = document.getElementById('axis');

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

	axis._steps =(ceiling, floor)=> {
		let increment = axis._increment(ceiling - floor);
		let steps = [0];

		while (steps.at(-1) < ceiling)
			steps.push(steps.at(-1) + increment);

		while (steps[0] > floor)
			steps.unshift(steps[0] - increment);

		return steps;
	}

	axis.ceiling =(newValue=null, render=true)=> {
		if (newValue===null || newValue===undefined)
			return get_cssVariable(axis.parentElement,'ceiling');

		console.log(axis);
		set_cssVariable(axis.parentElement,'ceiling', newValue);
		if (render) axis.render();
		
		return axis;
	}

	axis.floor =(newValue=null, render=true)=> {
		if (newValue===null || newValue===undefined)
			return get_cssVariable(axis.parentElement,'floor');

		console.log(axis);
		set_cssVariable(axis.parentElement,'floor', newValue);
		if (render) axis.render();
		
		return axis;
	}

	axis.getStep =(int)=> {
		let existing = axis.querySelector(`.step[axis-step="${int}"]`);
		if (existing) return existing;

		let newStep = document.createElement('div');
		newStep.classList.add('step');
		set_cssVariable(newStep, 'step', int);
		axis.querySelector('.steps').append(newStep);
		newStep.setAttribute('axis-step', int);
		newStep.innerText = int;

		return newStep;
	}

	axis.render =()=> {
		let floor = axis.floor();
		let ceiling = axis.ceiling();

		let steps = axis._steps(ceiling, floor);

		console.log(steps.at(-1) == ceiling, steps[0] == floor);

		axis.querySelectorAll('.step.visible').forEach(step => step.classList.remove('visible'));

		for (const step of steps) {
			axis.getStep(step).classList.add('visible');
		}

		if (ceiling != steps.at(-1)) axis.ceiling(steps.at(-1), false);
		if (floor != steps[0]) axis.floor(steps[0], false);

		return axis;
	}

	bars.set('axis', axis);
	return axis;
}

// for (let crop of activeCrops) {
// 	let bar = bar(crop.name);
// 	bar.seed(crop.seed);
// 	bar.sell(crop.sell);
// 	if (bar.max > axis().max) axis.ceiling(bar.max);
// 	if (bar.min < axis().min) axis.floor(bar.min);
// } 