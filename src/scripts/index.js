import 'regenerator-runtime';
import '../styles/styles.css';
import App from './pages/app';
import { swRegister } from './utils/sw-register';
import { initOfflineSyncListener } from './utils/sync-helper';

const app = new App({
  drawerButton: document.querySelector('#drawer-button'),
  navigationDrawer: document.querySelector('#navigation-drawer'),
  content: document.querySelector('#main-content'),
  navList: document.querySelector('#nav-list'),
});

window.addEventListener('hashchange', () => {
  app.renderPage();
});

window.addEventListener('load', async () => {
  await app.renderPage();
  await swRegister();
  initOfflineSyncListener();
});

const skipLinkElement = document.querySelector('.skip-link');
const mainContentElement = document.querySelector('#main-content');
if (skipLinkElement && mainContentElement) {
  skipLinkElement.addEventListener('click', (event) => {
    event.preventDefault();
    mainContentElement.focus();
  });
}
