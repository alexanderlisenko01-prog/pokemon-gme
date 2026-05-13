const apiBase = 'https://pokeapi.co/api/v2/pokemon';
const imageEl = document.getElementById('pokemonImage');
const messageText = document.getElementById('messageText');
const optionsGrid = document.getElementById('optionsGrid');
const nextButton = document.getElementById('nextButton');
const triesCount = document.getElementById('triesCount');
const scoreCount = document.getElementById('scoreCount');
const correctListEl = document.getElementById('correctList');
const cardEl = document.querySelector('.pokemon-card');

let currentPokemon = null;
let tries = 0;
let score = 0;
let canGuess = false;
let correctPokemons = [];

function sanitize(value) {
    return value.trim().toLowerCase();
}

function updateStatus() {
    triesCount.textContent = tries;
    scoreCount.textContent = score;
}

function updateCorrectList() {
    correctListEl.innerHTML = correctPokemons.map(name => `<li>${name}</li>`).join('');
}

function addCorrectPokemon(name) {
    const formatted = name[0].toUpperCase() + name.slice(1);
    if (!correctPokemons.includes(formatted)) {
        correctPokemons.push(formatted);
        updateCorrectList();
    }
}

function getRandomIds(correctId) {
    const ids = new Set([correctId]);
    while (ids.size < 4) {
        ids.add(Math.floor(Math.random() * 898) + 1);
    }
    return Array.from(ids);
}

async function fetchPokemon(id) {
    const response = await fetch(`${apiBase}/${id}`);
    if (!response.ok) {
        throw new Error('שגיאה בטעינת הנתונים');
    }
    const data = await response.json();
    return {
        id: data.id,
        name: data.name,
        types: data.types.map(item => item.type.name),
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
    };
}

function createOptionButton(name) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-button';
    button.textContent = name;
    button.addEventListener('click', () => selectAnswer(name));
    return button;
}

function renderOptions(options) {
    optionsGrid.innerHTML = '';
    options.forEach(option => {
        optionsGrid.appendChild(createOptionButton(option.name));
    });
}

async function loadPokemon() {
    canGuess = false;
    messageText.textContent = '';
    cardEl.classList.remove('revealed', 'correct', 'incorrect');
    imageEl.src = '';
    imageEl.alt = 'Loading Pokemon';
    optionsGrid.innerHTML = '';

    const randomId = Math.floor(Math.random() * 898) + 1;

    try {
        currentPokemon = await fetchPokemon(randomId);
        const optionIds = getRandomIds(currentPokemon.id);
        const optionPromises = optionIds.map(id => fetchPokemon(id));
        const optionPokemons = await Promise.all(optionPromises);
        const shuffledOptions = optionPokemons
            .map(pokemon => ({ name: pokemon.name }))
            .sort(() => Math.random() - 0.5);

        imageEl.src = currentPokemon.image;
        imageEl.alt = 'Pokemon silhouette';
        renderOptions(shuffledOptions);
        canGuess = true;
    } catch (error) {
        messageText.textContent = 'הייתה שגיאה בחיבור ל-PokeAPI. נסה שוב.';
        imageEl.alt = 'Error loading Pokemon';
        currentPokemon = null;
    }
}

function revealPokemon(isCorrect = false) {
    cardEl.classList.add('revealed');
    cardEl.classList.toggle('correct', isCorrect);
    cardEl.classList.toggle('incorrect', !isCorrect);

    if (currentPokemon) {
        imageEl.alt = currentPokemon.name;
        if (isCorrect) {
            addCorrectPokemon(currentPokemon.name);
        }
        messageText.textContent = isCorrect ? 'נכון! יופי!' : `לא נכון. הפוקימון היה ${currentPokemon.name.toUpperCase()}.`;
    }
    canGuess = false;
    Array.from(optionsGrid.children).forEach(button => button.disabled = true);
}

function selectAnswer(answer) {
    if (!currentPokemon) {
        messageText.textContent = 'טען פוקימון לפני הניחוש.';
        return;
    }

    if (!canGuess) {
        messageText.textContent = 'לחץ על הבא כדי לטעון פוקימון חדש.';
        return;
    }

    tries += 1;
    updateStatus();

    const correctName = sanitize(currentPokemon.name);
    if (sanitize(answer) === correctName) {
        score += 1;
        updateStatus();
        revealPokemon(true);
    } else {
        revealPokemon(false);
    }

    setTimeout(loadPokemon, 900);
}

nextButton.addEventListener('click', loadPokemon);

updateStatus();
loadPokemon();
