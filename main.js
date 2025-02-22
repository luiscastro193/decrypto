"use strict";
const zipPromise = import("https://luiscastro193.github.io/zip-string/zip-string.js");
const endpoint = "https://luiscastro193.com/scraper/words";
const codeElement = document.querySelector('p');
const wordsElement = document.querySelector('ol');
const [codeButton, wordsButton, shareButton, qrButton] = document.querySelectorAll('button');

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

async function shareURL(myWords) {
	return new URL('#' + await (await zipPromise).zip(myWords.join('\n')), location.href);
}

let words;
let areVisible = false;
let url;

async function getWords() {
	if (!words) {
		if (location.hash) {
			let compressed = location.hash.slice(1);
			words = (await zipPromise).unzip(compressed).then(myWords => myWords.split('\n'));
			history.pushState(null, '', ' ');
		}
		else
			words = request(endpoint).then(response => response.json());
		
		words.then(async myWords => {
			wordsElement.innerHTML = '';
			wordsElement.append(...myWords.map(toItem));
			url = await shareURL(myWords);
			shareButton.disabled = false;
			qrButton.disabled = false;
		});
		
		words.catch(error => {
			console.error(error);
			alert("Error, vuelva a intentarlo");
			location.reload();
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
		navigator.share({url});
	else
		navigator.clipboard.writeText(url).then(() => alert("Enlace copiado al portapapeles"));
};

qrButton.onclick = () => {
	window.open("https://luiscastro193.github.io/qr-generator/#" + encodeURIComponent(url));
};

window.onhashchange = () => location.reload();
[codeButton, wordsButton].forEach(button => {button.disabled = false});
