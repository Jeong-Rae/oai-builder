import { mountEditor } from './editorApp';
import './style.css';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Map Editor root element was not found.');
}

mountEditor(app);
