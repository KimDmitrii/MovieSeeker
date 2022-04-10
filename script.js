// Получение доступов
const titleInput = document.getElementById('title-input');
const typeSelect = document.getElementById('type-select');
const searchButton = document.getElementById('search-button');
const statusOutput = document.getElementById('status-output');
const searchResultsContainer = document
    .getElementById('search-results-container');

// Входные данные для поиска
let title;
let type;


// 1 Создание запроса
// const request = new XMLHttpRequest();

// Асинхронная функция для отправки запроса и получения ответа
async function getCinemaInfo(url) {
    const response = await fetch(url, {
        headers: {
            // API-ключ
            'X-API-KEY': '3f34bd18-4d59-4b6a-9016-40a20c22df3f'
        }
    });
    return await response.json();
}

//  Массив всех резултатов поиска
let generalSearchResults = [];

// Переменная текущей страницы результатов
let pageNumber = 1;

// Функция для обработки начального запроса
async function processInitialSearchRequest() {

    // Отмена запроса в случае отсутствия title
    if (!titleInput.value) {
        statusOutput.innerText = 'Empty title\nPlease enter title';
        return;
    }

    // Отмена запроса в случае повторения входных данных title и type
    if (titleInput.value == title && typeSelect.value == type) {
        statusOutput.innerText = 'Repeated title and type\nPlease enter new ones';

        return;
    }

    // Отмена запроса в случае несоответствия title к шаблону
    const regexp = /^[a-zа-я0-9][a-zа-я0-9 ,/!?&\-:]+$/i;

    if (!regexp.test(titleInput.value)) {
        statusOutput.innerText = 'Mistake in title\nTitle starts with letters, digits, please enter valid one';
        return;
    }

    // Входные данные для поиска
    title = titleInput.value;
    titleInput.value = '';
    type = typeSelect.value;

    statusOutput.innerText = `Search for ${type}\n"${title}"`;

    // Очистка результатов предыдущего поиска
    const cinemaCards = searchResultsContainer.querySelectorAll('.cinema-card');

    for (const cinemaCard of cinemaCards) {
        cinemaCard.remove();  
    }
    
    generalSearchResults = [];

    // 2 Инициализация запроса
    // Переменная текущей страницы результатов
    pageNumber = 1;

    // Формирование URL адреса
    const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&type=${type.toUpperCase()}&keyword=${title}&page=${pageNumber}`;

    // Отправка запроса и получение ответа
    const response = await getCinemaInfo(url);
    console.log('response :>> ', response);

    // Получение верного ответа с сервера
    const searchResults = response.items;
    generalSearchResults = generalSearchResults.concat(searchResults);

    // Обработка результатов поиска
    processSearchResults(searchResults);
    
}

// Обработка события submit
searchButton.addEventListener('click', processInitialSearchRequest);

// Обработка события по нажатию на клавиатуру
titleInput.addEventListener('keydown', function(event) {
    if (event.code == 'Enter') {
        processInitialSearchRequest();
    }
})

// Обработка события прокрутки
document.addEventListener('scroll', async function() {
    const availScrollHeight = document.documentElement.scrollHeight
         - document.documentElement.clientHeight;
    const currentScroll = Math.ceil(window.pageYOffset);

    if (currentScroll >= availScrollHeight) {
        // Переменная текущей страницы результатов
        pageNumber += 1;

        // Формирование URL адреса
        const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&type=${type.toUpperCase()}&keyword=${title}&page=${pageNumber}`;

        // Отправка запроса и получение ответа
        const response = await getCinemaInfo(url);
        console.log('response :>> ', response);

        // Получение верного ответа с сервера
        const searchResults = response.items;
        generalSearchResults = generalSearchResults.concat(searchResults);

        // Обработка результатов поиска
        processSearchResults(searchResults);

    }

});

// Обработка результатов поиска
function processSearchResults(searchResults) {
    
    for (const cinemaInfo of searchResults) { 

        // Деструктуризация объекта
        const { posterUrlPreview: poster, nameOriginal: title, ratingKinopoisk: rating, year, kinopoiskId } = cinemaInfo;
       
        // Создание новых HTML элементов
        const cinemaCard = 
            `<div class="cinema-card" data-kinopoisk-id ="${kinopoiskId}">
                <div class="poster">
                    <img src="${poster}" alt="Poster of ${title}">
                </div>
                <div class="info">
                    <div class="rating-favotite-container">
                        <p class="rating">Raiting: ${rating}</p>
                        <div class="favorite-icon"></div>
                    </div>
                    <h6 class="title">Title: ${title}</h6>
                    <p class="year">Year: ${year}</p>
                </div>
            </div>`;

        // Вставка нового HTML элемента
        searchResultsContainer.insertAdjacentHTML('beforeend', cinemaCard);
        
    }
}

// Обработка события клик по карточкам
searchResultsContainer.addEventListener('click', async function(event) {

    // Список избранного
    if (event.target.classList.contains('favorite-icon')) {
        const favoriteIcon = event.target;
        const kinopoiskId = favoriteIcon.closest('.cinema-card')
            .dataset.kinopoiskId;


        // Удаление из избранного
        if (favoriteIcon.classList.contains('active')) {
            favoriteIcon.classList.remove('active');

            localStorage.removeItem(kinopoiskId);
        } 
        // Добавление в избранное
        else {
            favoriteIcon.classList.add('active')

            generalSearchResults

            const cinemaInfo = generalSearchResults.find(
                cinemaInfo => cinemaInfo.kinopoiskId == kinopoiskId
            );

            localStorage.setItem(kinopoiskId, JSON.stringify(cinemaInfo));

        }

        console.log('localStorage :>> ', localStorage);

        return;
    }

    // Карточка фильма
    const cinemaCard = event.target.closest('.cinema-card')
    
    if (cinemaCard) {
        
        // ID фильма в базе OIMDB
        const kinopoiskId = cinemaCard.dataset.kinopoiskId;

        // Формирование URL адреса
        const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kinopoiskId}`;

        // Отправка запроса и получение ответа
         const cinemaFullInfo = await getCinemaInfo(url);

        // Деструктуризация объекта
        const {
            posterUrl: poster,
            ratingKinopoisk: rating, 
            nameOriginal: title, 
            genres, 
            countries,
            year, 
            shortDescription: description,
            webUrl
        } = cinemaFullInfo;

        // Создание новых HTML элементов
        const cinemaFullCard = 
            `<div id="fixed-container">
                <div id="cinema-full-card">
                    <div class="poster">
                        <img src="${poster}" alt="Poster of ${title}">
                    </div>
                    <div class="info">
                        <p class="rating">Kinopoisk Rating: ${rating}</p>
                        <h2 class="title">${title}</h2>
                        <h3 class="genre">Genres: 
                            ${genres.map(item => item.genre)
                                .join(', ')
                                .replace(/^./, letter => letter.toUpperCase())}
                        </h3>
                        <h3 class="countries">Countries: 
                            ${countries.map(item => item.country).join(', ')}
                        </h3>
                        <p class="year">Year: ${year}</p>
                        <p class="description">Plot: ${description}</p>
                        <a href="${webUrl}" target="_blank">Kinopoisk</a>
                    </div>
                    <button>&times;</button>
                </div>
            </div>`;
        
        // Вставка нового HTML элемента
        document.body.insertAdjacentHTML('beforeend', cinemaFullCard);

        // Закрытие окна
        document.querySelector('#cinema-full-card button')
            .addEventListener(
                'click', 
                function() {
                    document.querySelector('#cinema-full-card').remove();
                },
                { once: true }
            );
    }
});













/* // Получение доступов к элементам
const button = document.getElementById('click-button');
const span = document.getElementsByTagName('span')[0];

// Обработка события
button.addEventListener('click', function() {
    // Ввод входных данных от пользователя
    const title = prompt('Введите полное или частичное имя искомого фильма или мериала');
    
    // Вывод данных в элемент span
    span.innerText = title;

});
 */
