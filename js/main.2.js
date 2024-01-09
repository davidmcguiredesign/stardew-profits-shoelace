/**
 * @typedef {string} Key Name of an input, event, and cache value
 */

/* LIFECYCLE: The program is written in a series of tiny functions that each take an event value, modify it, and then send a new event. 
 */

/**
 * Conveniently dispatch an event + data at the document level.
 * 
 * @param {Key} key
 * @param {object} options Data to send with the event.
 */
function trigger(key, options) {
	document.dispatchEvent(new CustomEvent(key, options));
}

/**
 * Conveniently attach an event listener at the document level.
 * @param {Key} key
 * @param {CallableFunction} callback Action to perform when the event occurs 
 */
function listen(key, callback) {
	document.addEventListener(key, callback);
}

/**
 * Get a number input element. Optionally set its value.
 * 
 * @param {string} key The key of the option the input modifies. Used as the input name and as the dispatched event.
 * @param {number} [value] The value at which to set the input. 
 * @returns {HTMLInputElement}
 */
function num_input(key, value=undefined) {
	let inputName = key+'_input';
	let input = document.querySelector(`[name=${inputName}]`);

	if (!input) {
		input = document.createElement('input');
		input.name = inputName;
		input.type = 'number';
		input.onchange =(e)=> trigger(key,{
			value: e.target.value
		});
	}

	if (value !== undefined) {
		input.value = value;
		input.dispatchEvent(new Event('change'));
	}

	return input;
}

const store = {
	cache: function(key, value, calculation, [...listensFor]) {
		cache(this, ...arguments);
	}
};

/**
 * @param {object} host Something on which to store the property
 * @param {Key} key 
 * @param {*} value 
 * @param {CallableFunction} calculation 
 * @param { Key[] } listensFor
 */
function cache(host, key, value, calculation, [...listensFor]) {
	if (value !== undefined) {
		value = calculation(value);
	}

	if (value !== host[key]) {
		host[key] = value;
		trigger(key, { value });
	} else {
		// return { key, value }
	}

	for (let eventName of listensFor) {
		listen(eventName, calculation);
	}
}

const crop = {
	cache: function(key, calculation, [...listensFor]) {
		cache(this, ...arguments);
	}
}

store.cache('fert_growth', 0, (fertilizer, agriSkill)=> {
	if (agriSkill) fertilizer.growth -= 0.1;
	return fertilizer;
}, [
	store.cache('fertilizer'),
	store.cache('agriSkill'),
]);