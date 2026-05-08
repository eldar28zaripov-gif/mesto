const config = {
  baseUrl: 'https://mesto.nomoreparties.co/v1/apf-cohort-203',
  headers: {
    authorization: '8ad2cc4a-4e96-4d98-98d5-d526e881b360',
    'Content-Type': 'application/json',
  },
};

const getResponseData = (res) => {
  if (res.ok) {
    return res.json();
  }
  return Promise.reject(`Ошибка: ${res.status}`);
};

const request = (url, options = {}) => {
  return fetch(url, {
    headers: config.headers,
    ...options,
  }).then(getResponseData);
};

export const getUserInfo = () => request(`${config.baseUrl}/users/me`);
export const getCardList = () => request(`${config.baseUrl}/cards`);
export const setUserInfo = ({ name, about }) =>
  request(`${config.baseUrl}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify({ name, about }),
  });

export const setUserAvatar = (avatar) =>
  request(`${config.baseUrl}/users/me/avatar`, {
    method: 'PATCH',
    body: JSON.stringify({ avatar }),
  });

export const addCard = ({ name, link }) =>
  request(`${config.baseUrl}/cards`, {
    method: 'POST',
    body: JSON.stringify({ name, link }),
  });

export const deleteCard = (cardId) =>
  request(`${config.baseUrl}/cards/${cardId}`, {
    method: 'DELETE',
  });

export const changeLikeCardStatus = (cardId, isLiked) =>
  request(`${config.baseUrl}/cards/likes/${cardId}`, {
    method: isLiked ? 'DELETE' : 'PUT',
  });