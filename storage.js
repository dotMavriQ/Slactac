// slactac/storage.js

const SYNC_KEY = "chatRoomOverrides";

/**
 * A wrapper for browser.storage (normalized from chrome.storage) that gracefully
 * falls back to local storage if sync is unavailable or fails.
 */
const storage = {
  /**
   * Retrieves the chat room overrides. It first tries sync storage,
   * and if that fails, it tries local storage.
   * @returns {Promise<object>} A promise that resolves to the overrides object.
   */
  get: () => {
    return new Promise((resolve, reject) => {
      browser.storage.sync.get(SYNC_KEY).then(
        (data) => {
          resolve(data[SYNC_KEY] || {});
        },
        (error) => {
          console.warn(
            "SLACTAC Storage: Could not read from sync storage, falling back to local.",
            error
          );
          // If sync fails, try getting from local storage.
          browser.storage.local.get(SYNC_KEY).then(
            (localData) => {
              resolve(localData[SYNC_KEY] || {});
            },
            (localError) => {
              console.error(
                "SLACTAC Storage: Critical - Failed to read from local storage.",
                localError
              );
              reject(localError);
            }
          );
        }
      );
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
      browser.storage.sync.set({ [SYNC_KEY]: overrides }).then(
        () => {
          resolve();
        },
        (error) => {
          console.warn(
            "SLACTAC Storage: Could not save to sync storage, saving to local instead.",
            error
          );
          // If sync fails, save to local storage.
          browser.storage.local.set({ [SYNC_KEY]: overrides }).then(
            () => {
              resolve();
            },
            (localError) => {
              console.error(
                "SLACTAC Storage: Critical - Failed to save to local storage.",
                localError
              );
              reject(localError);
            }
          );
        }
      );
    });
  },

  /**
   * Removes all overrides. It attempts to clear from sync storage,
   * and always clears from local storage as well to ensure a clean state.
   * @returns {Promise<void>} A promise that resolves when the removal is complete.
   */
  clear: () => {
    return new Promise((resolve, reject) => {
      browser.storage.sync.remove(SYNC_KEY).then(
        () => {
          // Always attempt to clear local storage as well.
          return browser.storage.local.remove(SYNC_KEY);
        },
        (error) => {
          console.warn(
            "SLACTAC Storage: Could not clear sync storage.",
            error
          );
          // Continue to clear local storage even if sync fails
          return browser.storage.local.remove(SYNC_KEY);
        }
      ).then(
        () => {
          resolve();
        },
        (localError) => {
          console.error(
            "SLACTAC Storage: Critical - Failed to clear local storage.",
            localError
          );
          reject(localError);
        }
      );
    });
  },
};
