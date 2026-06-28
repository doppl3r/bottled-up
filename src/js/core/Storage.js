/*
  The storage class provides a simple wrapper for storing and retrieving
  key/value pairs in the browser's localStorage.
*/

class Storage {
  constructor() {
    
  }

  getItem = key => {
    return localStorage.getItem(key);
  }

  getItems = (match = '') => {
    const matches = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes(match)) matches[key] = getItem(key);
    }
    return matches;
  }

  setItem = (key, value) => {
    localStorage.setItem(key, value);
  }

  setItems = (items) => {
    // Create array of keys to loop through
    const keys = Object.keys(items);

    // Loop through all keys
    keys.forEach(key => {
      const value = items[key];
      const valueStorage = this.getItem(key);

      // Store new default key/value
      if (valueStorage === null) {
        this.setItem(key, value);
      }
    });
  }

  removeItem = key => {
    localStorage.removeItem(key);
  }

  removeItems = (match = '') => {
    // Create array of keys to loop through
    const keys = Object.keys(localStorage);

    // Loop through all keys
    keys.forEach(key => {
      if (key.includes(match)) this.removeItem(key);
    });
  }
}

export { Storage }