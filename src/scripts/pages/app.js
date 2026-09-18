import routes from '../routes/routes';
import UrlParser from '../routes/url-parser';
import DicodingStoryApi from '../data/api';
import { setupPushNotification } from '../utils/sw-register';

class App {
  constructor({ navigationDrawer, drawerButton, content, navList }) {
    this.content = content;
    this.drawerButton = drawerButton;
    this.navigationDrawer = navigationDrawer;
    this.navList = navList;

    this._setupDrawer();
  }

  _setupDrawer() {
    if (this.drawerButton) {
      this.drawerButton.addEventListener('click', () => {
        this.navigationDrawer.classList.toggle('open');
      });

      document.body.addEventListener('click', (event) => {
        if (!this.navigationDrawer.contains(event.target) && !this.drawerButton.contains(event.target)) {
          this.navigationDrawer.classList.remove('open');
        }

        this.navigationDrawer.querySelectorAll('a').forEach((link) => {
          if (link.contains(event.target)) {
            this.navigationDrawer.classList.remove('open');
          }
        });
      });
    }
  }

  _updateNav() {
    const isLoggedIn = !!DicodingStoryApi.getAuthToken();
    if (isLoggedIn) {
      this.navList.innerHTML = `
        <li><a href="#/">Home</a></li>
        <li><a href="#/add">Add Story</a></li>
        <li><a href="#/favorite">Favorites</a></li>
        <li><button id="push-toggle-btn" class="nav-btn" aria-label="Toggle Push Notification">🔔 Enable Push</button></li>
        <li><button id="install-btn" class="nav-btn btn-install" style="display: none;" aria-label="Install App">📲 Install App</button></li>
        <li><a href="javascript:void(0)" id="logout-btn" role="button" aria-label="Logout">Logout</a></li>
      `;
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          DicodingStoryApi.logout();
          window.location.hash = '#/login';
        });
      }
      setupPushNotification();
    } else {
      this.navList.innerHTML = `
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
        <li><button id="install-btn" class="nav-btn btn-install" style="display: none;" aria-label="Install App">📲 Install App</button></li>
      `;
    }
  }

  async renderPage() {
    this._updateNav();
    let url = UrlParser.parseActiveUrlWithCombiner();

    // Auth Guard
    const isLoggedIn = !!DicodingStoryApi.getAuthToken();
    const guestRoutes = ['/login', '/register'];
    if (!isLoggedIn && !guestRoutes.includes(url)) {
      window.location.hash = '#/login';
      return;
    }
    if (isLoggedIn && guestRoutes.includes(url)) {
      window.location.hash = '#/';
      return;
    }

    const page = routes[url] || routes['/'];

    const render = async () => {
      this.content.innerHTML = await page.render();
      if (page.afterRender) {
        await page.afterRender();
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => render());
    } else {
      await render();
    }
  }
}

export default App;
