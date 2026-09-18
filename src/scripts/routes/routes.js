import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import AddStoryPage from '../pages/add/add-story-page';
import FavoritePage from '../pages/favorite/favorite-page';
import DetailPage from '../pages/detail/detail-page';

const routes = {
  '/': new HomePage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add': new AddStoryPage(),
  '/favorite': new FavoritePage(),
  '/detail/:id': new DetailPage(),
};

export default routes;
