const inputList = popupProfile.querySelectorAll('.popup__input');

const validationConfig = {
  formSelector: '.popup__form',
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__btn-submit',
  inactiveButtonClass: '.popup__btn-submit_invalid',
  inputErrorClass: '.popup__input_invalid',
  errorClass: '.popup__error_visible',
  error: '.error',
  popupInput: '.popup__input'
};


function checkError(form, config) {     /* очистка от ошибок при открытии попап-карточки*/
  const errors = form.querySelectorAll(config.error);
  const popupInput = form.querySelectorAll(config.popupInput);
  errors.forEach(e => {
      e.textContent = "";
  });

  popupInput.forEach(e => {
      e.classList.remove(config.inputErrorClass);
  });
}

function showError(form, input, config){
  const error = form.querySelector(`#${input.id}-error`);
  error.textContent = input.validationMessage;
  input.classList.add(config.inputErrorClass);
}

function hideError(form, input, config){
  const error = form.querySelector(`#${input.id}-error`);
  error.textContent = "";
  input.classList.remove(config.inputErrorClass);
}

function checkInputValidity(form, input, config){
  if(input.validity.valid){
    hideError(form, input, config);
  } else {
    showError(form, input, config);
  }
}

function setButtonState(button, isActive, config){
  if(isActive){
  button.classList.remove(config.inactiveButtonClass);
  button.disabled = false;
  } else {
    button.classList.add(config.inactiveButtonClass);
    button.disabled = true;
  }
}

function setEventListener(form, config){
  const popupBtnSubmit = form.querySelector(config.submitButtonSelector); /* кнопка submit попапа*/
  const inputList = form.querySelectorAll(config.inputSelector);

  inputList.forEach( input => {
    input.addEventListener('input', (evt)=>{
      checkInputValidity(form, input, config);
      setButtonState(popupBtnSubmit, form.checkValidity(), config);
    });
  });
}

function enableValidation(config){
  const forms = document.querySelectorAll(config.formSelector);
  forms.forEach(form => {
    setEventListener(form, config);

    form.addEventListener('submit', (evt)=>{
      evt.preventDefault();
      });

      const popupBtnSubmit = form.querySelector(config.submitButtonSelector); /* кнопка submit попапа*/
      setButtonState(popupBtnSubmit, form.checkValidity(), config);
  });
}


enableValidation(validationConfig);