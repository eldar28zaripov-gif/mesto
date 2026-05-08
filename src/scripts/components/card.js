export class Card {
  constructor(data, templateSelector, currentUserId, handleCardClick, handleLikeClick, handleDeleteClick) {
    this._data = data;
    this._templateSelector = templateSelector;
    this._currentUserId = currentUserId;
    this._handleCardClick = handleCardClick;
    this._handleLikeClick = handleLikeClick;
    this._handleDeleteClick = handleDeleteClick;
  }

  _getTemplate() {
    return document
      .querySelector(this._templateSelector)
      .content
      .querySelector('.card')
      .cloneNode(true);
  }

  generateCard() {
    this._element = this._getTemplate();
    this._imageElement = this._element.querySelector('.card__image');
    this._titleElement = this._element.querySelector('.card__title');
    this._likeButton = this._element.querySelector('.card__like-button');
    this._likeCount = this._element.querySelector('.card__like-count');
    this._deleteButton = this._element.querySelector('.card__delete-button');

    this._imageElement.src = this._data.link;
    this._imageElement.alt = this._data.name;
    this._titleElement.textContent = this._data.name;

    if (this._data.owner._id !== this._currentUserId) {
      this._deleteButton.remove();
      this._deleteButton = null;
    }

    this._updateLikeView();
    this._setEventListeners();

    return this._element;
  }

  _setEventListeners() {
    this._imageElement.addEventListener('click', () => {
      this._handleCardClick(this._data.name, this._data.link);
    });

    this._likeButton.addEventListener('click', () => {
      this._handleLikeClick(this);
    });

    if (this._deleteButton) {
      this._deleteButton.addEventListener('click', () => {
        this._handleDeleteClick(this);
      });
    }
  }

  _isLiked() {
    return this._data.likes.some((user) => user._id === this._currentUserId);
  }

  _updateLikeView() {
    this._likeButton.classList.toggle('card__like-button_is-active', this._isLiked());
    this._likeCount.textContent = String(this._data.likes.length);
  }

  updateLikes(likes) {
    this._data.likes = likes;
    this._updateLikeView();
  }

  removeCard() {
    this._element.remove();
  }

  getId() {
    return this._data._id;
  }
}