import { Storage } from './Storage.js';

/*
  The Record class provides methods to get and set storage items per session.
*/

class Record {
  constructor(prefix = 'record', items = {}) {
    // Initialize storage components
    this.prefix = prefix;
    this.items = items;
    this.idMin = 0;
    this.idMax = 10;
    this.storage = new Storage();

    // Retrieve (or save) unique record ID
    this.id = this.parseId( this.storage.getItem(`${ this.prefix }-record-id`));
    this.storage.setItem(`${ this.prefix }-record-id`, this.id);
    
    // Save default items
    this.saveItems(items);
  }

  save(key, value) {
    // Resolve value to string if it's an object/array
    if (typeof value === 'object') value = JSON.stringify(value);
    
    // Save record value to storage with namespaced key
    this.storage.setItem(`${ this.prefix }-${ this.id }-${ key }`, value);
  }

  load(key, type = 'string') {
    // Load record value from storage with namespaced key
    let item = this.storage.getItem(`${ this.prefix }-${ this.id }-${ key }`);
    if (item === null) return undefined;

    // Resolve item type
    switch (type) {
      case 'number': item = Number(item); break;
      case 'boolean': item = item === 'true'; break;
      case 'string':
        // Attempt to parse JSON object/array from string
        if (this.isJsonParsable(item)) item = JSON.parse(item);
      break;
    }

    // Return the resolved item
    return item;
  }

  clear(key) {
    this.storage.removeItem(`${ this.prefix }-${ this.id }-${ key }`);
  }

  clearRecord(id) {
    this.storage.removeItems(`${ this.prefix }-${ id }-`);
  }

  clearCurrentRecord() {
    this.clearRecord(this.id);
  }

  setId(id = 0) {
    this.id = this.parseId(id);
    this.storage.setItem(`${ this.prefix }-record-id`, this.id);
  }

  parseId(id) {
    const value = Number(id);
    const normalizedValue = Number.isFinite(value) ? value : this.idMin;
    return Math.min(this.idMax, Math.max(this.idMin, normalizedValue));
  }

  updateFromStorage(data) {
    // Loop through all default record keys
    Object.entries(this.items).forEach(([defaultKey, defaultValue]) => {
      if (data.hasOwnProperty(defaultKey)) {
        // Get type from default value and enforce string type for arrays
        const isArray = Array.isArray(defaultValue);
        const type = isArray ? 'string' : typeof defaultValue;

        // Load item from storage (or use default value)
        const item = this.load(defaultKey, type);
        data[defaultKey] = item ?? defaultValue;
      }
    });
  }

  saveItems(items = {}) {
    // Save items to storage if undefined
    Object.entries(items).forEach(([key, value]) => {
      if (this.load(key) === undefined) {
        this.save(key, value);
      }
    });
  }

  isJsonParsable(str) {
    try { JSON.parse(str); return true; }
    catch (e) {
      return false;
    }
  }
}

export { Record };