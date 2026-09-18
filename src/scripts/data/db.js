import CONFIG from '../config';

const { DATABASE_NAME, DATABASE_VERSION, OBJECT_STORE_FAVORITES, OBJECT_STORE_OFFLINE_QUEUE } = CONFIG;

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OBJECT_STORE_FAVORITES)) {
        db.createObjectStore(OBJECT_STORE_FAVORITES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(OBJECT_STORE_OFFLINE_QUEUE)) {
        db.createObjectStore(OBJECT_STORE_OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const FavoriteStoryDb = {
  async getFavorite(id) {
    if (!id) return null;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE_FAVORITES, 'readonly');
      const store = tx.objectStore(OBJECT_STORE_FAVORITES);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllFavorites() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE_FAVORITES, 'readonly');
      const store = tx.objectStore(OBJECT_STORE_FAVORITES);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async putFavorite(story) {
    if (!story || !story.id) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE_FAVORITES, 'readwrite');
      const store = tx.objectStore(OBJECT_STORE_FAVORITES);
      const request = store.put(story);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteFavorite(id) {
    if (!id) return;
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE_FAVORITES, 'readwrite');
      const store = tx.objectStore(OBJECT_STORE_FAVORITES);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

const OfflineStoryDb = {
  async addOfflineStory(storyData) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE_OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(OBJECT_STORE_OFFLINE_QUEUE);
      const request = store.add(storyData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllOfflineStories() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE_OFFLINE_QUEUE, 'readonly');
      const store = tx.objectStore(OBJECT_STORE_OFFLINE_QUEUE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteOfflineStory(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE_OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(OBJECT_STORE_OFFLINE_QUEUE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

export { FavoriteStoryDb, OfflineStoryDb };
