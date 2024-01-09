/**
 * Sets a CSS property as an inline style on an element, returning the property value. Defaults to setting a custom CSS property.
 * @param {HTMLElement} element The element on which to define the custom CSS property
 * @param {string} key The name of the custom CSS property
 * @param {string|number} value The value of the custom CSS property
 * @param {string} prefix Can be changed to set/access other inline CSS styles
 * @returns {string|number} The value set on the custom CSS property
 */
function set_css(element, key, value, prefix='--') {
	let existing = element.getAttribute('style') || '';
	if (existing.includes(key)) {
		let regex = `(?<=${prefix}${key}:)[^;]+(?=;)`;
		existing = existing.replace(new RegExp(regex), value);
	} else {
		existing += `${prefix}${key}:${value};`;
	}
	element.setAttribute('style', existing);

	return value;
}

/**
 * Returns the value of a CSS property set as an inline style on an element. Defaults to looking for a custom CSS property.
 * @param {HTMLElement} element The element on which to define the CSS property
 * @param {string} key The name of the CSS property
 * @param {string|number} value The value of the CSS property
 * @param {string} prefix Can be changed to access standard CSS properties
 * @returns {string|number|undefined} The value set on the custom CSS property
 */
function get_css(element, key, prefix='--') {
	let existing = element.getAttribute('style') || '';

	existing = existing.match(new RegExp(`(?<=${prefix}${key}:)[^;]+(?=;)`));
	return existing ? existing[0] : undefined;
}

function bar(cropName) {
	return chart.bar(cropName);
}

class ProfitChart extends HTMLElement {

	static generate_steps(ceiling, floor, precision) {
		const increments = [5, 10, 20, 25];
		const range = ceiling - floor;
		let scale = 1;

		while (range / increments[0] * scale > precision) {
			increments.push(increments.shift());
			if (increments[0] == 5) scale *= 10;
		}

		const increment = increments[0] * scale;
		const steps = [0];

		while (steps.at(-1) < ceiling)
			steps.push(steps.at(-1) + increment);
		while (steps[0] > floor)
			steps.unshift(steps[0] - increment);

		return steps;
	}

	precision = 20;
	#axis;
	#bars = new Map();
	#steps = new Map();
 
	constructor() { super(); }
 
	connectedCallback() {
		console.log("ProfitChart added to page.", this);
		document.addEventListener("DOMContentLoaded", e=> this.render_axis()); // does not work outside callback
	}

	step(int) {
		let existing = this.#steps.get(`step ${int}`);
		if (existing) return existing;

		let newStep = document.createElement('div');
		newStep.classList.add('step');
		set_css(newStep, 'step', int);
		this.axis.append(newStep);
		newStep.innerText = int;

		return newStep;
	}

	get axis() {
		if (!this.#axis) this.#axis = this.querySelector('.axis');
		return this.#axis;
	}

	/**
	 * Sets the lower bound of the chart, and re-renders the axis if necessary. 
	 * @param {int} newValue The floor of the chart, less than or equal to zero
	 * @returns The floor value of the chart
	 */
	floor(newValue=undefined) {
		let limit = true;

		let oldValue = get_css(this, 'floor');
		if (newValue === undefined) return oldValue; 
		if (limit) if (oldValue < newValue) return oldValue;

		set_css(this, 'floor', newValue);
		if (limit) this.render_axis();
		return newValue;
	}

	/**
	 * Sets the upper bound of the chart, and re-renders the axis if necessary. 
	 * @param {int} newValue The ceiling of the chart, less than or equal to zero
	 * @returns The ceiling value of the chart
	 */
	ceiling(newValue=undefined) {
		let limit = true;

		let oldValue = get_css(this, 'ceiling');
		if (newValue === undefined) return oldValue;
		if (limit) if (newValue < oldValue) return oldValue;

		set_css(this, 'ceiling', newValue);
		if (limit) this.render_axis();
		return newValue;
	}

	render_axis() {
		let ceiling = 5;
		let floor = 0;

		console.group('traversing bars...');
		for (const v of this.#bars.values()) {
			if (!v.hasAttribute('active')) continue;
			console.log('checking active bar', v);
			ceiling = Math.max(ceiling, v);
			floor = Math.min(floor, v);
		}
		console.groupEnd();

		const steps = ProfitChart.generate_steps(
			ceiling,
			floor,
			this.precision
		);

		this.querySelectorAll('.step.visible')
			.forEach(step => step.classList.remove('visible'));

		steps.forEach(step => this.step(step).classList.add('visible'));

		if (ceiling != steps.at(-1)) this.ceiling(steps.at(-1));
		if (floor != steps[0]) this.ceiling(steps[0]);

		return this;
	}

	bar(cropName) {
		if (this.#bars.has(cropName)) return this.#bars.get(cropName);
	
		const bar = document.getElementById('bar_template').content.cloneNode(true).children[0];
		bar.setAttribute('data-crop', cropName);
		bar.setAttribute('active', true);
	
		/** @return {number} The bar’s seed value */
		bar.seed =(value)=> {
			return set_css(bar, 'seed', value);
		}
		
		/** @return {number} The bar’s sell value */
		bar.sell =(value)=> {
			return set_css(bar, 'sell', value);
		}
		
		/** @return {number} The bar’s fert value */
		bar.fert =(value)=> {
			return set_css(bar, 'fert', value);
		}
		
		/** @return {HTMLElement} The bar */
		bar.disable =()=> {
			bar.classList.remove('active');
			bar.removeAttribute('active');
			return bar;
		}
		
		/** @return {HTMLElement} The bar */
		bar.enable =()=> {
			bar.classList.add('active');
			bar.setAttribute('active', true);
			return bar;
		}
	
		this.append(bar);
		this.#bars.set(cropName, bar);
		
		return this.#bars.get(cropName);
	}

	/**
	 * Takes a crop and renders seed, sell, fert, and profit in a bar.
	 * @param {object} crop The cropdata object
	 */
	cropBar(crop) {
		let bar = this.bar(crop.name);
		const seed = bar.seed( seedLoss(crop) );
		const sell = bar.sell( sell(crop).sell );
		const fert = bar.fert( fertLoss(crop) );
		this.ceiling(0 - seed - fert + sell);
	}
}

customElements.define("profit-chart", ProfitChart);