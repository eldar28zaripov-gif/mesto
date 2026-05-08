import { Modal } from './components/modal.js';
import { Card } from './components/card.js';
import { enableValidation, clearValidation } from './components/validation.js';
import {
  addCard,
  changeLikeCardStatus,
  deleteCard,
  getCardList,
  getUserInfo,
  setUserAvatar,
  setUserInfo,
} from './components/api.js';

const profileEditButton = document.querySelector('.profile__edit-button');
const profileAddButton = document.querySelector('.profile__add-button');
const profileAvatarButton = document.querySelector('.profile__image');
const profileStatsButton = document.querySelector('.profile__stats-button');

const profileName = document.querySelector('.profile__title');
const profileAbout = document.querySelector('.profile__description');
const profileAvatar = document.querySelector('.profile__image');

const placesList = document.querySelector('.places__list');
const cardTemplateSelector = '.template';

const popupEditProfile = document.querySelector('.popup_type_edit');
const popupNewCard = document.querySelector('.popup_type_new-card');
const popupAvatar = document.querySelector('.popup_type_avatar');
const popupImage = document.querySelector('.popup_type_image');
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

const validationConfig = {
  formSelector: '.popup__form',
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__error_visible',
};

let currentUserId = null;
let currentUserData = null;
let cards = [];

const editProfileModal = new Modal('.popup_type_edit');
const addCardModal = new Modal('.popup_type_new-card');
const editAvatarModal = new Modal('.popup_type_avatar');
const imageModal = new Modal('.popup_type_image');
const statsModal = new Modal('.popup_type_stats');

function openModal(modal) {
  modal.open();
}

function closeModal(modal) {
  modal.close();
}

function formatDate(dateString) {
  if (!dateString) {
    return '-';
  }

  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isCardLikedByUser(cardData) {
  return cardData.likes.some((user) => user._id === currentUserId);
}

function getUsersStats(cardsList) {
  const usersMap = new Map();

  cardsList.forEach((card) => {
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
}

function renderUsersStats(usersStats) {
  statsUsersList.textContent = '';
  if (!usersStats.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Пока нет данных';
    statsUsersList.append(emptyItem);
    return;
  }

  usersStats.forEach((userStat) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${userStat.name} (${userStat.count})`;
    statsUsersList.append(listItem);
  });
}

function updateStatistics() {
  const usersStats = getUsersStats(cards);
  const dates = cards
    .map((card) => card.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b));

  statsTotalCards.textContent = String(cards.length);
  statsFirstCreated.textContent = formatDate(dates[0]);
  statsLastCreated.textContent = formatDate(dates[dates.length - 1]);
  statsTotalUsers.textContent = String(usersStats.length);
  statsMaxCards.textContent = String(usersStats.reduce((max, user) => Math.max(max, user.count), 0));

  renderUsersStats(usersStats);
}

function createCardElement(cardData) {
  const card = new Card(
    cardData,
    cardTemplateSelector,
    currentUserId,
    handleCardClick,
    handleCardLike,
    handleCardDelete,
  );

  return card.generateCard();
}

function renderCards(cardList) {
  cardList.forEach((cardData) => {
    placesList.append(createCardElement(cardData));
  });
}

function handleCardClick(name, link) {
  imagePopupElement.src = link;
  imagePopupElement.alt = name;
  imagePopupCaption.textContent = name;
  openModal(imageModal);
}

function handleCardLike(cardInstance) {
  const isLiked = cardInstance._data.likes.some((user) => user._id === currentUserId);
  changeLikeCardStatus(cardInstance.getId(), isLiked)
    .then((updatedCard) => {
      cardInstance.updateLikes(updatedCard.likes);
    })
    .catch(() => {
      // Ошибка обрабатывается в .catch
    });
}

function handleCardDelete(cardInstance) {
  deleteCard(cardInstance.getId())
    .then(() => {
      cardInstance.removeCard();
      cards = cards.filter((card) => card._id !== cardInstance.getId());
      updateStatistics();
    })
    .catch(() => {
      // Ошибка обрабатывается в .catch
    });
}

function fillUserInfo(userData) {
  profileName.textContent = userData.name;
  profileAbout.textContent = userData.about;
  profileAvatar.style.backgroundImage = `url('${userData.avatar}')`;
}

function openEditProfilePopup() {
  nameInput.value = profileName.textContent;
  aboutInput.value = profileAbout.textContent;
  clearValidation(formEditProfile, validationConfig);
  openModal(editProfileModal);
}

function openNewCardPopup() {
  formNewCard.reset();
  clearValidation(formNewCard, validationConfig);
  openModal(addCardModal);
}

function openEditAvatarPopup() {
  formAvatar.reset();
  clearValidation(formAvatar, validationConfig);
  openModal(editAvatarModal);
}

function handleProfileSubmit(evt) {
  evt.preventDefault();
  const submitButton = evt.submitter;
  submitButton.textContent = 'Сохранение...';

  setUserInfo({
    name: nameInput.value,
    about: aboutInput.value,
  })
    .then((userData) => {
      currentUserData = userData;
      fillUserInfo(userData);
      closeModal(editProfileModal);
    })
    .catch(() => {
      // Ошибка обрабатывается в .catch
    })
    .finally(() => {
      submitButton.textContent = 'Сохранить';
    });
}

function handleNewCardSubmit(evt) {
  evt.preventDefault();
  const submitButton = evt.submitter;
  submitButton.textContent = 'Создание...';

  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      cards.unshift(cardData);
      const cardElement = createCardElement(cardData);
      placesList.prepend(cardElement);
      updateStatistics();
      closeModal(addCardModal);
      formNewCard.reset();
    })
    .catch(() => {
      // Ошибка обрабатывается в .catch
    })
    .finally(() => {
      submitButton.textContent = 'Создать';
    });
}

function handleAvatarSubmit(evt) {
  evt.preventDefault();
  const submitButton = evt.submitter;
  submitButton.textContent = 'Сохранение...';

  setUserAvatar(avatarInput.value)
    .then((userData) => {
      currentUserData = userData;
      fillUserInfo(userData);
      closeModal(editAvatarModal);
    })
    .catch(() => {
      // Ошибка обрабатывается в .catch
    })
    .finally(() => {
      submitButton.textContent = 'Сохранить';
    });
}

function initApp() {
  enableValidation(validationConfig);

  editProfileModal.setEventListeners();
  addCardModal.setEventListeners();
  editAvatarModal.setEventListeners();
  imageModal.setEventListeners();
  statsModal.setEventListeners();

  profileEditButton.addEventListener('click', openEditProfilePopup);
  profileAddButton.addEventListener('click', openNewCardPopup);
  profileAvatarButton.addEventListener('click', openEditAvatarPopup);
  profileStatsButton.addEventListener('click', () => {
    updateStatistics();
    openModal(statsModal);
  });

  formEditProfile.addEventListener('submit', handleProfileSubmit);
  formNewCard.addEventListener('submit', handleNewCardSubmit);
  formAvatar.addEventListener('submit', handleAvatarSubmit);

  Promise.all([getUserInfo(), getCardList()])
    .then(([userData, cardList]) => {
      currentUserId = userData._id;
      currentUserData = userData;
      cards = cardList;
      fillUserInfo(userData);
      renderCards(cardList);
      updateStatistics();
    })
    .catch(() => {
      // Ошибка обрабатывается в .catch
    });
}

initApp();