import CONFIG from '../config';

const { BASE_URL } = CONFIG;

class DicodingStoryApi {
  static getAuthToken() {
    return localStorage.getItem('token');
  }

  static async register(name, email, password) {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  }

  static async login(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (!result.error && result.loginResult) {
      localStorage.setItem('token', result.loginResult.token);
      localStorage.setItem('userId', result.loginResult.userId);
      localStorage.setItem('userName', result.loginResult.name);
    }
    return result;
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  }

  static async getStories(location = 1) {
    const token = this.getAuthToken();
    const response = await fetch(`${BASE_URL}/stories?location=${location}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }

  static async getStoryDetail(id) {
    const token = this.getAuthToken();
    const response = await fetch(`${BASE_URL}/stories/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }

  static async addStory(description, photo, lat, lon) {
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat) formData.append('lat', lat);
    if (lon) formData.append('lon', lon);

    const response = await fetch(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.json();
  }

  static async subscribePushNotification(subscription) {
    const token = this.getAuthToken();
    if (!token) return { error: true, message: 'User not logged in' };

    const response = await fetch(`${BASE_URL}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscription),
    });
    return response.json();
  }

  static async unsubscribePushNotification(subscription) {
    const token = this.getAuthToken();
    if (!token) return { error: true, message: 'User not logged in' };

    const response = await fetch(`${BASE_URL}/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription ? subscription.endpoint : '' }),
    });
    return response.json();
  }
}

export default DicodingStoryApi;
