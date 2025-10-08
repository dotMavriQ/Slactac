// slactac/storage.js

const SYNC_KEY = "chatRoomOverrides";

/**
 * A wrapper for chrome.storage that gracefully falls back to local storage
 * if sync is unavailable or fails.
 */
const storage = {
  /**
   * Retrieves the chat room overrides. It first tries sync storage,
   * and if that fails, it tries local storage.
   * @returns {Promise<object>} A promise that resolves to the overrides object.
   */
  get: () => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(SYNC_KEY, (data) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "SLACTAC Storage: Could not read from sync storage, falling back to local.",
            chrome.runtime.lastError.message
          );
          // If sync fails, try getting from local storage.
          chrome.storage.local.get(SYNC_KEY, (localData) => {
            if (chrome.runtime.lastError) {
              console.error(
                "SLACTAC Storage: Critical - Failed to read from local storage.",
                chrome.runtime.lastError.message
              );
              reject(chrome.runtime.lastError);
            } else {
              resolve(localData[SYNC_KEY] || {});
            }
          });
        } else {
          resolve(data[SYNC_KEY] || {});
        }
      });
    });
  },

  /**
   * Saves the chat room overrides. It attempts to save to sync storage first,
   * but if that fails, it saves to local storage as a reliable backup.
   * @param {object} overrides The overrides object to save.
   * @returns {Promise<void>} A promise that resolves when the save is complete.
   */
  set: (overrides) => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [SYNC_KEY]: overrides }, () => {
        if (chrome.runtime.lastError) {
          console.warn(
            "SLACTAC Storage: Could not save to sync storage, saving to local instead.",
            chrome.runtime.lastError.message
          );
          // If sync fails, save to local storage.
          chrome.storage.local.set({ [SYNC_KEY]: overrides }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "SLACTAC Storage: Critical - Failed to save to local storage.",
                chrome.runtime.lastError.message
              );
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Removes all overrides. It attempts to clear from sync storage,
   * and always clears from local storage as well to ensure a clean state.
   * @returns {Promise<void>} A promise that resolves when the removal is complete.
   */
  clear: () => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(SYNC_KEY, () => {
        if (chrome.runtime.lastError) {
          console.warn(
            "SLACTAC Storage: Could not clear sync storage.",
            chrome.runtime.lastError.message
          );
        }
        // Always attempt to clear local storage as well.
        chrome.storage.local.remove(SYNC_KEY, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "SLACTAC Storage: Critical - Failed to clear local storage.",
              chrome.runtime.lastError.message
            );
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  },
};
