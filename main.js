"use strict";
const zipPromise = import("https://luiscastro193.github.io/zip-string/zip-string.js");
const endpoint = "https://luiscastro193.com/scraper/words";
const codeElement = document.querySelector('p');
const wordsElement = document.querySelector('ol');
const [codeButton, wordsButton, shareButton, qrButton, resetButton] = document.querySelectorAll('button');

async function request(resource, options) {
	let response = await fetch(resource, options);
	if (response.ok) return response; else throw response;
}

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let j = Math.trunc(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	
	return array;
}

function toItem(string) {
	let li = document.createElement("li");
	li.textContent = string;
	return li;
}

let words;
let areVisible = false;

async function getWords() {
	if (!words) {
		if (location.hash)
			words = (await zipPromise).unzip(location.hash.slice(1)).then(myWords => myWords.split('\n'));
		else
			words = request(endpoint).then(response => response.json());
		
		words.then(async myWords => {
			wordsElement.innerHTML = '';
			wordsElement.append(...myWords.map(toItem));
			if (!location.hash) history.pushState(null, '', '#' + await (await zipPromise).zip(myWords.join('\n')));
			shareButton.disabled = false;
			qrButton.disabled = false;
			resetButton.disabled = false;
		});
		
		words.catch(error => {
			console.error(error);
			alert("Error, vuelva a intentarlo");
			location.href = ' ';
		});
	}
	
	return words;
}

let code = [1, 2, 3, 4];
let isRepeated = true;
let isValid = false;

async function toText(i) {
	let text = code[i].toString();
	
	if (areVisible)
		text += ': ' + (await getWords())[code[i] - 1];
	
	return text;
}

async function printCode() {
	let text = (await Promise.all(Array.from({length: 3}, (x, i) => toText(i)))).join(', ');
	if (isRepeated) text += ' (otra vez)';
	codeElement.textContent = text;
}

codeButton.onclick = () => {
	let lastCode = JSON.stringify(code);
	code = shuffle(code);
	isRepeated = !isRepeated && JSON.stringify(code) == lastCode;
	isValid = true;
	printCode();
};

wordsButton.onclick = () => {
	getWords();
	wordsElement.hidden = areVisible;
	wordsButton.textContent = areVisible ? "Mostrar palabras" : "Ocultar palabras";
	areVisible = !areVisible;
	if (isValid) printCode();
};

shareButton.onclick = () => {
	if (navigator.share)
		navigator.share({url: location.href});
	else
		navigator.clipboard.writeText(location.href).then(() => alert("Enlace copiado al portapapeles"));
};

qrButton.onclick = () => {
	window.open("https://luiscastro193.github.io/qr-generator/#" + encodeURIComponent(location.href));
};

window.onhashchange = () => location.reload();
resetButton.onclick = () => {location.href = ' '};
[codeButton, wordsButton].forEach(button => {button.disabled = false});
[shareButton, qrButton, resetButton].forEach(button => {button.disabled = true});
