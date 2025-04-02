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
const STORAGE_KEY = "chatRoomOverrides";
const LOCAL_PICK_KEY = "lastPickedChannelName";

// --- Utility Functions ---
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

function notifyContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "refreshNamesSLACTAC" });
    } else {
      console.warn(
        "SLACTAC: Could not find active tab ID to send refresh message."
      );
    }
  });
}

function loadStoredTacks() {
  tacksTable.innerHTML = "";
  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    if (chrome.runtime.lastError) {
      showMessage(
        `Error loading tacks: ${chrome.runtime.lastError.message}`,
        true
      );
      return;
    }
    const overrides = data[STORAGE_KEY] || {};
    const keys = Object.keys(overrides);
    if (keys.length === 0) {
      tacksTable.innerHTML = '<div class="tack-row">No tacks stored yet.</div>';
      return;
    }
    keys.forEach((originalName) => {
      const customName = overrides[originalName];
      const row = document.createElement("div");
      row.className = "tack-row";
      row.innerHTML = `
        <div class="tack-names">
          <div class="tack-custom">${customName}</div>
          <div class="tack-original">${originalName}</div>
        </div>
        <div class="tack-delete" data-original="${originalName}">✕</div>
      `;
      tacksTable.appendChild(row);
    });
    document.querySelectorAll(".tack-delete").forEach((button) => {
      button.addEventListener("click", function () {
        const originalName = this.getAttribute("data-original");
        deleteTack(originalName);
      });
    });
  });
}

function deleteTack(originalName) {
  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    if (chrome.runtime.lastError) {
      showMessage(`Error: ${chrome.runtime.lastError.message}`, true);
      return;
    }
    const overrides = data[STORAGE_KEY] || {};
    if (originalName in overrides) {
      delete overrides[originalName];
      chrome.storage.sync.set({ [STORAGE_KEY]: overrides }, () => {
        if (chrome.runtime.lastError) {
          showMessage(`Error: ${chrome.runtime.lastError.message}`, true);
        } else {
          showMessage("Tack deleted!");
          loadStoredTacks();
          notifyContentScript();
        }
      });
    }
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
  });
  mainView.classList.add("hidden");
  storedView.classList.remove("hidden");
  loadStoredTacks();
}

// --- Event Listeners ---
saveButton.addEventListener("click", () => {
  const originalName = originalNameInput.value.trim();
  const newName = newNameInput.value.trim();
  if (!originalName || !newName) {
    showMessage("Both original and new names are required.", true);
    return;
  }
  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    if (chrome.runtime.lastError) {
      showMessage(
        `Error loading overrides: ${chrome.runtime.lastError.message}`,
        true
      );
      return;
    }
    const overrides = data[STORAGE_KEY] || {};
    overrides[originalName] = newName;
    chrome.storage.sync.set({ [STORAGE_KEY]: overrides }, () => {
      if (chrome.runtime.lastError) {
        showMessage(
          `Error saving override: ${chrome.runtime.lastError.message}`,
          true
        );
      } else {
        showMessage("Tack saved successfully!");
        originalNameInput.value = "";
        newNameInput.value = "";
        originalNameInput.focus();
        chrome.storage.local.remove(LOCAL_PICK_KEY);
        notifyContentScript();
      }
    });
  });
});

channelPickerButton.addEventListener("click", () => {
  const manualChannel = originalNameInput.value.trim();
  if (manualChannel) {
    showMessage("Using manually entered channel name");
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id && tabs[0].url?.includes("slack.com")) {
      const tabId = tabs[0].id;
      console.log(
        `SLACTAC Popup: Sending activateChannelPicker to tab ${tabId}`
      );
      chrome.tabs.sendMessage(
        tabId,
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
            chrome.tabs.sendMessage(tabId, {
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
    } else {
      console.error("SLACTAC Popup: Could not find suitable active Slack tab.");
      showMessage("Could not find active Slack tab.", true);
    }
  });
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

// --- Listen for Messages from Content Script ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "channelPicked" && message.channelName) {
    console.log("SLACTAC Popup: Received channelPicked", message.channelName);
    chrome.storage.local.set({ [LOCAL_PICK_KEY]: message.channelName }, () => {
      console.log("SLACTAC Popup: Stored lastPickedChannelName.");
    });
    originalNameInput.value = message.channelName;
    showMessage("Channel selected!", false);
    document.body.classList.remove("channel-picker-active");
  } else if (message.action === "pickerDeactivated") {
    console.log("SLACTAC Popup: Received pickerDeactivated");
    showMessage("Picker deactivated.", false);
    document.body.classList.remove("channel-picker-active");
  }
});

// --- Initialize the Popup ---
function initPopup() {
  chrome.storage.local.get(LOCAL_PICK_KEY, (data) => {
    if (data[LOCAL_PICK_KEY]) {
      originalNameInput.value = data[LOCAL_PICK_KEY];
      console.log(
        "SLACTAC Popup: Loaded stored channel:",
        data[LOCAL_PICK_KEY]
      );
    }
  });
  showMainView();
  messageElement.style.visibility = "hidden";
  console.log("SLACTAC Popup: Initialized and ready.");
}

document.addEventListener("DOMContentLoaded", initPopup);
