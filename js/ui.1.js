const Bars = {
	template: document.querySelector('template#bar').content.firstElementChild
};
const Panels = {
	template: document.querySelector('template#panel').content.firstElementChild
};
const Chart = document.querySelector('#chart');
const Steps = Chart.querySelector('#chart .steps');
const Options = options;

/**
 * Adds or changes a property within the inline CSS `style` attribute. By default, assumes the property to set is a custom property.
 * 
 * @param {HTMLElement} element 
 * @param {string} key The name of the CSS property
 * @param {string|number} value The value of the CSS property
 * @param {string} prefix By default, property is assumed to be a custom CSS property `--` is prepended to the key.
 * @returns {HTMLElement} The same element passed, for chaining.
 */
function set_cssProp(element, key, value, prefix='--') {
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

/**
 * Retrieves value of a property within the inline CSS `style` attribute. By default, assumes the property to retrieve is a custom property.
 * 
 * @param {HTMLElement} element 
 * @param {string} key The name of the CSS property
 * @param {string} prefix By default, property is assumed to be a custom CSS property `--` is prepended to the key.
 * @returns {HTMLElement|false} The same element passed, for chaining.
 */
function get_cssProp(element, key, prefix='--') {
	let existing = element.getAttribute('style') || '';

	existing = existing.match(new RegExp(`(?<=${prefix}${key}:)[^;]+(?=;)`));
	return existing ? existing[0] : false;
}

/**
 * Create a div element with classes
 * 
 * @param  { string[] } classes 
 * @returns { HTMLDivElement }
 */
function div(...classes) {
	let div = document.createElement('div');
	for (let cl of classes) div.classList.add(cl);
	return div;
}

/**
 * Get node for step on axis, creating it first if necessary. Steps are positioned by CSS rather than sorted by HTML.
 * @param {number} int The step number. 
 * @returns {HTMLDivElement}
 */
function step(int) {
	const existing = Steps.querySelector(`[step="${int}"]`);
	if (existing) return existing;

	const step = div('step');
	set_cssProp(step, 'step', int);
	step.setAttribute('step', int);
	step.innerText = int;
	
	Steps.append(step);
	return step;
}

/**
 * Get node for bar in crop, creating it first if necessary.
 * @param { object } crop 
 * @param { string } crop.name
 * @param { string } crop.icon
 * @returns { HTMLDivElement }
 */
function bar({
	name,
	icon
}) {
	if (Bars[name] !== undefined) {
		return Bars[name];
	}

	const bar = Bars.template.cloneNode(true);
	bar.dataset.crop = name
	bar.querySelector('img').setAttribute('src', "/img/"+icon);

	bar.addEventListener('click', e=> infoPanel({name}));

	Chart.append(bar);
	Bars[name] = bar;
	return Bars[name];
}

function infoPanel({
	name
}) {
	if (Panels[name] !== undefined) {
		return Panels[name];
	}

	const panel = Panels.template.cloneNode(true);
}

/**
 * 
 * @param {Object} crop
 * @param {String} crop.name
 * @param {Number} crop.planted
 * @param {Number} crop.seedLoss The minimum seed price * the number of seeds that can be bought
 * @param {Number} grossProfit
 * @param {Number} netProfit
 */
function drawCrop({
	name,
	planted,
	seedLoss,
	gross,
	net
}) {
	if (Chart.mostProfit < net) {
		console.log('raising chart ceiling...');
		Chart.mostProfit = net;
	}
	
	if (seedLoss < Chart.mostLoss) {
		console.log('lowering chart floor...');
		Chart.mostLoss = seedLoss;
	}

	const chartBar = bar({
		name,
		icon: 'gold.png',
	});

	set_cssProp(chartBar, 'seed', planted * seedLoss);

	set_cssProp(chartBar, 'sell', gross);

	// Fertilizer is consumed only at the change of season when not underneath a cross-season crop. If a cross-season crop is planted the same day it is harvested (as is assumed for this page’s calculations), fertilizer will never exceed the cost of 1 fertilizer per crop. But it still cannot be safely drawn at the chart level because budget might affect the number planted.  
}

function drawCrops(crops) {
	const fertLoss = Options.buyFert ? 12 : 0;
	Chart.mostProfit = 0;
	Chart.mostLoss = fertLoss;

	for (const crop of crops) {
		drawCrop({
			name: crop.name,
			planted: crop.planted,
			seedLoss: crop.seedLoss - fertLoss,
			gross: crop.grossProfit || crop.profit,
			net: crop.netProfit,
		});
	}

	set_cssProp(Chart, 'fert', fertLoss);

	drawAxis(Chart.mostLoss, Chart.mostProfit);
}

function drawAxis(least, most) {
	const maxSteps = 20;
	const range = most - least;

	let scale = 1;
	const increments = [5, 10, 20, 25];

	while (range / (increments[0] * scale) > maxSteps) {
		increments.push(increments.shift());
		if (increments[0] == 5) scale *= 10;
	}

	const increment = increments[0] * scale;
	const steps = [0];
	
	while (steps.at(-1) < most)
		steps.push(steps.at(-1) + increment);
	while (steps[0] > least)
		steps.unshift(steps[0] - increment);

	set_cssProp(Chart, 'ceiling', steps.at(-1));
	set_cssProp(Chart, 'floor', steps[0]);

	Steps.querySelectorAll('[step].visible').forEach(step => step.classList.remove('visible'));

	for (const s of steps) {
		step(s).classList.add('visible');
	}
}

function readToggle(el) {
	return el.checked ? 1 : 0;
}

function readNumber(el) {
	return parseInt(el.value);
}

function input(optionKey, onChange, inputType='number') {
	const el = document.querySelector(`input[name=${inputName}]`);
	if (inputType=='bool') {
		el.addEventListener('change', ()=> Options[optionKey] = readToggle(el));
	} else {
		el.addEventListener('change', ()=> Options[optionKey] = readNumber(el));
	}
}

/* 
 * Things that are all connected: property of Options, input name, event name, serialized URL parameter. 
 * 
 * Events have effects and inputs have types. 
 */

