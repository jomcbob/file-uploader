const popup = document.getElementById('contact-popup');
const popupContainer = document.getElementById('popup-container');
const closeBtns = document.querySelectorAll('.closePopup');
const openFilePopup = document.getElementById('openFilePopup');
const openFolderPopup = document.getElementById('openFolderPopup');
const fileForm = document.getElementById('fileForm');
const folderForm = document.getElementById('folderForm');

openFilePopup.addEventListener('click', () => {
  popup.style.display = 'flex';
  fileForm.classList.remove('hidden');
  folderForm.classList.add('hidden');
  popupContainer.classList.add('popup-open-animation');
});

openFolderPopup.addEventListener('click', () => {
  popup.style.display = 'flex';
  folderForm.classList.remove('hidden');
  fileForm.classList.add('hidden');
  popupContainer.classList.add('popup-open-animation');
});

if (closeBtns) {
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      popup.style.display = 'none';
      popupContainer.classList.remove('popup-open-animation');
    });
  });
}

window.addEventListener('click', (event) => {
  if (event.target === popup) {
    popup.style.display = 'none';
    popupContainer.classList.remove('popup-open-animation');
  }
});
