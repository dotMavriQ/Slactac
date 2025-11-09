// popup.js

// --- DOM Elements ---
const originalNameInput = document.getElementById("original-name");
const newNameInput = document.getElementById("new-name");
const saveButton = document.getElementById("save");
const channelPickerButton = document.getElementById("channel-picker");
const viewStoredButton = document.getElementById("view-stored");
const backToMainButton = document.getElementById("back-to-main");
const messageElement = document.getElementById("message");
const mainView = document.getElementById("main-view");
const storedView = document.getElementById("stored-view");
const tacksTable = document.getElementById("tacks-table");

// --- Constants ---
const MESSAGE_TIMEOUT_MS = 3000;
const LOCAL_PICK_KEY = "lastPickedChannelName";

// --- Utility Functions ---
function applyPickedChannelName(channelName, { showFeedback = true } = {}) {
  if (typeof channelName !== "string") return;
  const trimmed = channelName.trim();
  if (!trimmed) return;
  const previousValue = originalNameInput.value;
  originalNameInput.value = trimmed;
  loadOverrideForChannel(trimmed);
  if (showFeedback && previousValue !== trimmed) {
    showMessage("Channel selected!", false);
  }
  document.body?.classList.remove("channel-picker-active");
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    const resolveFromTabs = (tabs) => {
      if (tabs && tabs.length > 0 && typeof tabs[0].id === "number") {
        resolve(tabs[0]);
      } else {
        reject(new Error("Could not determine the active tab."));
      }
    };

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (tabs && tabs.length > 0) {
        resolveFromTabs(tabs);
        return;
      }

      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (fallbackTabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolveFromTabs(fallbackTabs);
      });
    });
  });
}

function showMessage(text, isError = false) {
  if (!messageElement) return;
  messageElement.textContent = text;
  messageElement.style.color = isError
    ? "var(--message-error)"
    : "var(--message-success)";
  messageElement.style.visibility = "visible";
  setTimeout(() => {
    if (messageElement.textContent === text) {
      messageElement.textContent = "";
      messageElement.style.visibility = "hidden";
    }
  }, MESSAGE_TIMEOUT_MS);
}

function debounce(fn, wait = 200) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

async function loadOverrideForChannel(channelName) {
  const trimmed = typeof channelName === "string" ? channelName.trim() : "";
  if (!trimmed) {
    newNameInput.value = "";
    return;
  }

  try {
    const overrides = await storage.get();
    const stored = overrides[trimmed];
    newNameInput.value = typeof stored === "string" ? stored : "";
  } catch (error) {
    console.error("SLACTAC Popup: Failed to load override for channel.", error);
    showMessage("Couldn't load stored tack for that channel.", true);
    newNameInput.value = "";
  }
}

function loadOverrideForCurrentChannel() {
  const currentChannel = originalNameInput.value;
  loadOverrideForChannel(currentChannel);
}

const debouncedLoadOverrideForCurrentChannel = debounce(
  loadOverrideForCurrentChannel,
  200
);

function loadLastPickedChannel() {
  chrome.storage.local.get(LOCAL_PICK_KEY, (data) => {
    if (chrome.runtime.lastError) {
      console.warn(
        "SLACTAC Popup: Could not load last picked channel.",
        chrome.runtime.lastError.message
      );
      return;
    }
    const storedName = data[LOCAL_PICK_KEY];
    if (typeof storedName === "string" && storedName.trim()) {
      applyPickedChannelName(storedName, { showFeedback: false });
    }
  });
}

function notifyContentScript() {
  getActiveTab()
    .then((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: "refreshNamesSLACTAC" }, () => {
        if (chrome.runtime.lastError) {
          console.warn(
            `SLACTAC: Could not send refresh message to tab ${tab.id}: ${chrome.runtime.lastError.message}`
          );
        }
      });
    })
    .catch((error) => {
      console.warn(`SLACTAC: ${error.message}`);
    });
}

function loadStoredTacks() {
  tacksTable.innerHTML = "";
  storage.get().then((overrides) => {
    const keys = Object.keys(overrides);
    if (keys.length === 0) {
      const emptyRow = document.createElement("div");
      emptyRow.className = "tack-row";
      emptyRow.textContent = "No tacks stored yet.";
      tacksTable.innerHTML = "";
      tacksTable.appendChild(emptyRow);
      return;
    }
    keys.forEach((originalName) => {
      const customName = overrides[originalName];
      const row = document.createElement("div");
      row.className = "tack-row";

      const namesDiv = document.createElement("div");
      namesDiv.className = "tack-names";

      const customDiv = document.createElement("div");
      customDiv.className = "tack-custom";
      customDiv.textContent = customName;

      const originalDiv = document.createElement("div");
      originalDiv.className = "tack-original";
      originalDiv.textContent = originalName;

      namesDiv.appendChild(customDiv);
      namesDiv.appendChild(originalDiv);

      const deleteDiv = document.createElement("div");
      deleteDiv.className = "tack-delete";
      deleteDiv.setAttribute("data-original", originalName);
      deleteDiv.textContent = "✕";

      row.appendChild(namesDiv);
      row.appendChild(deleteDiv);
      tacksTable.appendChild(row);
    });
    document.querySelectorAll(".tack-delete").forEach((button) => {
      button.addEventListener("click", function () {
        const originalName = this.getAttribute("data-original");
        deleteTack(originalName);
      });
    });
  }).catch(error => {
    showMessage(`Error loading tacks: ${error.message}`, true);
  });
}

function deleteTack(originalName) {
  storage.get().then(overrides => {
    if (originalName in overrides) {
      const { [originalName]: _removed, ...rest } = overrides;
      storage.set(rest).then(() => {
        showMessage("Tack deleted!");
        loadStoredTacks();
        notifyContentScript();
      }).catch(error => {
        showMessage(`Error: ${error.message}`, true);
      });
    }
  }).catch(error => {
    showMessage(`Error: ${error.message}`, true);
  });
}

// --- View Navigation ---
function showMainView() {
  mainView.classList.remove("hidden");
  storedView.classList.add("hidden");
}

function showStoredView() {
  chrome.storage.local.remove(LOCAL_PICK_KEY, () => {
    originalNameInput.value = "";
    newNameInput.value = "";
  });
  mainView.classList.add("hidden");
  storedView.classList.remove("hidden");
  loadStoredTacks();
}

// --- Storage Change Sync ---
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (!Object.prototype.hasOwnProperty.call(changes, LOCAL_PICK_KEY)) return;
  const { newValue } = changes[LOCAL_PICK_KEY];
  if (typeof newValue !== "string") return;
  applyPickedChannelName(newValue, { showFeedback: false });
});

// --- Event Listeners ---
originalNameInput.addEventListener("input", () => {
  debouncedLoadOverrideForCurrentChannel();
});

saveButton.addEventListener("click", () => {
  const originalName = originalNameInput.value.trim();
  const newName = newNameInput.value.trim();
  if (!originalName || !newName) {
    showMessage("Both original and new names are required.", true);
    return;
  }
  storage.get().then(overrides => {
    const updatedOverrides = {
      ...overrides,
      [originalName]: newName,
    };
    storage.set(updatedOverrides).then(() => {
      showMessage("Tack saved successfully!");
      originalNameInput.value = "";
      newNameInput.value = "";
      originalNameInput.focus();
      // Clear the locally stored picked name after a successful save.
      chrome.storage.local.remove(LOCAL_PICK_KEY);
      notifyContentScript();
    }).catch(error => {
      showMessage(`Error saving override: ${error.message}`, true);
    });
  }).catch(error => {
    showMessage(`Error loading overrides: ${error.message}`, true);
  });
});

channelPickerButton.addEventListener("click", async () => {
  try {
    const tab = await getActiveTab();
    console.log(
      `SLACTAC Popup: Sending activateChannelPicker to tab ${tab.id}`
    );
    chrome.tabs.sendMessage(
      tab.id,
      { action: "activateChannelPicker" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            `SLACTAC Popup: Error sending 'activateChannelPicker' message: ${chrome.runtime.lastError.message}`
          );
          showMessage(
            "Cannot communicate with page. Make sure you're on Slack and the page is fully loaded.",
            true
          );
          chrome.tabs.sendMessage(tab.id, {
            action: "deactivateChannelPicker",
          });
          document.body.classList.remove("channel-picker-active");
        } else if (response && response.success) {
          console.log(
            "SLACTAC Popup: Picker activation acknowledged by content script."
          );
          showMessage(
            "Picker active! Click a channel on the Slack page.",
            false
          );
          document.body.classList.add("channel-picker-active");
        } else {
          console.warn(
            `SLACTAC Popup: Content script reported activation failure: ${response?.status}`
          );
          showMessage(
            response?.status || "Failed to activate picker on page.",
            true
          );
          document.body.classList.remove("channel-picker-active");
        }
      }
    );
  } catch (error) {
    console.error("SLACTAC Popup: Could not find suitable active tab.", error);
    showMessage(error.message || "Could not find active tab.", true);
  }
});

viewStoredButton.addEventListener("click", () => {
  showStoredView();
});

backToMainButton.addEventListener("click", () => {
  showMainView();
});

newNameInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveButton.click();
  }
});

// --- Initial Load ---
loadLastPickedChannel();
loadOverrideForCurrentChannel();
