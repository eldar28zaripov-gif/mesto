
import {
    addCard,
    changeLikeCardStatus,
    deleteCard,
    getCardList,
    getUserInfo,
    setUserAvatar,
    setUserInfo,
} from './api.js';

const profileEditButton = document.querySelector('.profile__edit-button');
const profileAddButton = document.querySelector('.profile__add-button');
const profileAvatarButton = document.querySelector('.profile__image');
const profileStatsButton = document.querySelector('.profile__stats-button');

const profileName = document.querySelector('.profile__title');
const profileAbout = document.querySelector('.profile__description');
const profileAvatar = document.querySelector('.profile__image');

const placesList = document.querySelector('.places__list');
const cardTemplate = document.querySelector('.template').content.querySelector('.card');

const popupEditProfile = document.querySelector('.popup_type_edit');
const popupNewCard = document.querySelector('.popup_type_new-card');
const popupImage = document.querySelector('.popup_type_image');
const popupAvatar = document.querySelector('.popup_type_avatar');
const popupStats = document.querySelector('.popup_type_stats');

const formEditProfile = popupEditProfile.querySelector('.popup__form');
const formNewCard = popupNewCard.querySelector('.popup__form');
const formAvatar = popupAvatar.querySelector('.popup__form');

const nameInput = formEditProfile.querySelector('.popup__input_type_name');
const aboutInput = formEditProfile.querySelector('.popup__input_type_description');
const cardNameInput = formNewCard.querySelector('.popup__input_type_card-name');
const cardLinkInput = formNewCard.querySelector('.popup__input_type_url');
const avatarInput = formAvatar.querySelector('.popup__input_type_avatar-url');

const imagePopupElement = popupImage.querySelector('.popup__image');
const imagePopupCaption = popupImage.querySelector('.popup__caption');

const statsTotalCards = popupStats.querySelector('[data-stat="total-cards"]');
const statsFirstCreated = popupStats.querySelector('[data-stat="first-created"]');
const statsLastCreated = popupStats.querySelector('[data-stat="last-created"]');
const statsTotalUsers = popupStats.querySelector('[data-stat="total-users"]');
const statsMaxCards = popupStats.querySelector('[data-stat="max-cards"]');
const statsUsersList = popupStats.querySelector('[data-stat="users-list"]');

let currentUserId = '';
let currentUserData = null;
let cardsState = [];

const formatDate = (dateValue) => {
    if (!dateValue) {
        return '-';
    }

    return new Date(dateValue).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const getUsersStats = (cards) => {
    const usersMap = new Map();

    cards.forEach((card) => {
        const owner = card.owner;

        if (!usersMap.has(owner._id)) {
            usersMap.set(owner._id, {
                id: owner._id,
                name: owner.name,
                count: 0,
            });
        }

        usersMap.get(owner._id).count += 1;
    });

    if (currentUserData && !usersMap.has(currentUserData._id)) {
        usersMap.set(currentUserData._id, {
            id: currentUserData._id,
            name: currentUserData.name,
            count: 0,
        });
    }

    return Array.from(usersMap.values()).sort((a, b) => {
        if (b.count !== a.count) {
            return b.count - a.count;
        }

        return a.name.localeCompare(b.name, 'ru');
    });
};

const renderUsersStatsList = (usersStats) => {
    statsUsersList.innerHTML = '';

    if (!usersStats.length) {
        const emptyItem = document.createElement('li');
        emptyItem.classList.add('popup__stats-user');
        emptyItem.textContent = 'Пока нет данных';
        statsUsersList.append(emptyItem);
        return;
    }

    usersStats.forEach((userStats) => {
        const userItem = document.createElement('li');
        userItem.classList.add('popup__stats-user');
        userItem.textContent = `${userStats.name} (${userStats.count})`;
        statsUsersList.append(userItem);
    });
};

const updateStatistics = () => {
    const usersStats = getUsersStats(cardsState);
    const creationDates = cardsState
        .map((card) => card.createdAt)
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b));

    const maxCardsByOneUser = usersStats.reduce((max, userStats) => {
        return Math.max(max, userStats.count);
    }, 0);

    statsTotalCards.textContent = String(cardsState.length);
    statsFirstCreated.textContent = formatDate(creationDates[0]);
    statsLastCreated.textContent = formatDate(creationDates[creationDates.length - 1]);
    statsTotalUsers.textContent = String(usersStats.length);
    statsMaxCards.textContent = String(maxCardsByOneUser);

    renderUsersStatsList(usersStats);
};

const openPopup = (popup) => {
    popup.classList.add('popup_is-opened');
    document.addEventListener('keydown', handleEscClose);
};

const closePopup = (popup) => {
    popup.classList.remove('popup_is-opened');

    if (!document.querySelector('.popup_is-opened')) {
        document.removeEventListener('keydown', handleEscClose);
    }
};

function handleEscClose(evt) {
    if (evt.key !== 'Escape') {
        return;
    }

    const openedPopup = document.querySelector('.popup_is-opened');
    if (openedPopup) {
        closePopup(openedPopup);
    }
}

const setButtonText = (button, text) => {
    button.textContent = text;
};

const fillProfile = (userData) => {
    profileName.textContent = userData.name;
    profileAbout.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url('${userData.avatar}')`;
};

const isCardLiked = (likes) => {
    return likes.some((user) => user._id === currentUserId);
};

const updateLikeView = (cardElement, cardData) => {
    const likeButton = cardElement.querySelector('.card__like-button');
    const likeCount = cardElement.querySelector('.card__like-count');
    const liked = isCardLiked(cardData.likes);

    likeButton.classList.toggle('card__like-button_is-active', liked);
    likeCount.textContent = cardData.likes.length;
};

const createCard = (cardData) => {
    const cardElement = cardTemplate.cloneNode(true);
    const imageElement = cardElement.querySelector('.card__image');
    const titleElement = cardElement.querySelector('.card__title');
    const likeButton = cardElement.querySelector('.card__like-button');
    const deleteButton = cardElement.querySelector('.card__delete-button');

    imageElement.src = cardData.link;
    imageElement.alt = cardData.name;
    titleElement.textContent = cardData.name;

    updateLikeView(cardElement, cardData);

    imageElement.addEventListener('click', () => {
        imagePopupElement.src = cardData.link;
        imagePopupElement.alt = cardData.name;
        imagePopupCaption.textContent = cardData.name;
        openPopup(popupImage);
    });

    likeButton.addEventListener('click', () => {
        changeLikeCardStatus(cardData._id, isCardLiked(cardData.likes))
            .then((updatedCard) => {
                cardData.likes = updatedCard.likes;
                updateLikeView(cardElement, updatedCard);
            })
            .catch((err) => {
                console.log(err);
            });
    });

    if (cardData.owner._id === currentUserId) {
        deleteButton.addEventListener('click', () => {
            deleteCard(cardData._id)
                .then(() => {
                    cardElement.remove();
                    cardsState = cardsState.filter((card) => card._id !== cardData._id);
                    updateStatistics();
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    } else {
        deleteButton.remove();
    }

    return cardElement;
};

const renderCards = (cards) => {
    cards.forEach((card) => {
        placesList.append(createCard(card));
    });
};

const handleProfileSubmit = (evt) => {
    evt.preventDefault();
    const submitButton = evt.submitter;

    setButtonText(submitButton, 'Сохранение...');

    setUserInfo({
        name: nameInput.value,
        about: aboutInput.value,
    })
        .then((userData) => {
            fillProfile(userData);
            closePopup(popupEditProfile);
        })
        .catch((err) => {
            console.log(err);
        })
        .finally(() => {
            setButtonText(submitButton, 'Сохранить');
        });
};

const handleCardSubmit = (evt) => {
    evt.preventDefault();
    const submitButton = evt.submitter;

    setButtonText(submitButton, 'Создание...');

    addCard({
        name: cardNameInput.value,
        link: cardLinkInput.value,
    })
        .then((cardData) => {
            placesList.prepend(createCard(cardData));
            cardsState = [cardData, ...cardsState];
            updateStatistics();
            formNewCard.reset();
            closePopup(popupNewCard);
        })
        .catch((err) => {
            console.log(err);
        })
        .finally(() => {
            setButtonText(submitButton, 'Создать');
        });
};

const handleAvatarSubmit = (evt) => {
    evt.preventDefault();
    const submitButton = evt.submitter;

    setButtonText(submitButton, 'Сохранение...');

    setUserAvatar(avatarInput.value)
        .then((userData) => {
            fillProfile(userData);
            formAvatar.reset();
            closePopup(popupAvatar);
        })
        .catch((err) => {
            console.log(err);
        })
        .finally(() => {
            setButtonText(submitButton, 'Сохранить');
        });
};

document.querySelectorAll('.popup').forEach((popup) => {
    popup.addEventListener('mousedown', (evt) => {
        if (evt.target.classList.contains('popup') || evt.target.classList.contains('popup__close')) {
            closePopup(popup);
        }
    });
});

profileEditButton.addEventListener('click', () => {
    nameInput.value = profileName.textContent;
    aboutInput.value = profileAbout.textContent;
    openPopup(popupEditProfile);
});

profileAddButton.addEventListener('click', () => {
    formNewCard.reset();
    openPopup(popupNewCard);
});

profileAvatarButton.addEventListener('click', () => {
    formAvatar.reset();
    openPopup(popupAvatar);
});

profileStatsButton.addEventListener('click', () => {
    updateStatistics();
    openPopup(popupStats);
});

formEditProfile.addEventListener('submit', handleProfileSubmit);
formNewCard.addEventListener('submit', handleCardSubmit);
formAvatar.addEventListener('submit', handleAvatarSubmit);

Promise.all([getCardList(), getUserInfo()])
    .then(([cards, userData]) => {
        currentUserId = userData._id;
        currentUserData = userData;
        cardsState = cards;
        fillProfile(userData);
        renderCards(cards);
        updateStatistics();
    })
    .catch((err) => {
        console.log(err);
    });