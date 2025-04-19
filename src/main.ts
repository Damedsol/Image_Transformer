import './style.css';
import './components/DropZone';
import './components/ImagePreview';
import './components/ConversionOptions';
import './components/ImageConverter';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  if (app) {
    app.innerHTML = `
      <image-converter></image-converter>
    `;
  }
});
