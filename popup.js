// popup.js

// --- DOM Elements ---
const originalNameInput = document.getElementById("original-name");
const newNameInput = document.getElementById("new-name");
const saveButton = document.getElementById("save");
const clearAllButton = document.getElementById("clear-all");
const messageElement = document.getElementById("message");

// --- Constants ---
const MESSAGE_TIMEOUT_MS = 3000; // How long messages stay visible (in milliseconds)
const STORAGE_KEY = "chatRoomOverrides"; // Consistent key for storage

// --- Utility Functions ---

/**
 * Displays a message in the designated message area and clears it after a timeout.
 * @param {string} text The message text.
 * @param {boolean} [isError=false] If true, styles the message as an error.
 */
function showMessage(text, isError = false) {
  // Sanitize message text to prevent XSS
  const sanitizedText = text.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return char;
    }
  });
  
  messageElement.textContent = sanitizedText; // Using textContent is safe but adding sanitization as extra protection
  // Use CSS variables defined in popup.css for colors
  messageElement.style.color = isError
    ? "var(--message-error)"
    : "var(--message-success)";
  messageElement.style.visibility = "visible"; // Make sure it's visible

  // Clear message after a timeout
  setTimeout(() => {
    messageElement.textContent = "";
    messageElement.style.visibility = "hidden"; // Hide to collapse space if needed
  }, MESSAGE_TIMEOUT_MS);
}

/**
 * Optional: Sends a message to the active tab's content script to refresh names.
 */
function notifyContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Check if we found an active tab and it has an ID
    if (tabs && tabs[0] && tabs[0].id) {
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(
        tabId,
        { action: "refreshNamesSLACTAC" },
        (response) => {
          // Check for errors when sending message (e.g., content script not injected/ready)
          if (chrome.runtime.lastError) {
            // This is common if the user is not on a Slack tab, so don't show an error popup
            console.warn(
              `SLACTAC: Could not send refresh message to tab ${tabId}: ${chrome.runtime.lastError.message}`
            );
          } else {
            // Optional: Log success if needed
            // console.log("SLACTAC: Content script notified.", response);
          }
        }
      );
    } else {
      console.warn(
        "SLACTAC: Could not find active tab ID to send refresh message."
      );
    }
  });
}

// --- Event Listeners ---

// Handle the "Save Tack" button click event
saveButton.addEventListener("click", () => {
  // Sanitize input values
  const originalName = originalNameInput.value.trim();
  const newName = newNameInput.value.trim();

  // Enhanced validation
  if (!originalName || !newName) {
    showMessage("Both original and new names are required.", true);
    return; // Stop execution if validation fails
  }
  
  // Maximum length validation
  if (originalName.length > 100 || newName.length > 100) {
    showMessage("Names must be less than 100 characters.", true);
    return;
  }
  
  // Prevent HTML/script injection - important for security
  if (/<[^>]*>/g.test(originalName) || /<[^>]*>/g.test(newName)) {
    showMessage("HTML tags are not allowed in names.", true);
    return;
  }

  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    // **GOOD:** Check for errors getting data
    if (chrome.runtime.lastError) {
      showMessage(
        `Error loading overrides: ${chrome.runtime.lastError.message}`,
        true
      );
      return;
    }

    const overrides = data[STORAGE_KEY] || {};
    overrides[originalName] = newName;

    // Save the updated overrides
    chrome.storage.sync.set({ [STORAGE_KEY]: overrides }, () => {
      // **GOOD:** Check for errors saving data
      if (chrome.runtime.lastError) {
        showMessage(
          `Error saving override: ${chrome.runtime.lastError.message}`,
          true
        );
      } else {
        showMessage("Tack saved successfully!");
        originalNameInput.value = ""; // Clear inputs on success
        newNameInput.value = "";
        originalNameInput.focus(); // Set focus back to the first input for faster multi-adds
        notifyContentScript(); // Tell content script to update UI
      }
    });
  });
});

// Handle the "Clear All Tacks" button click event
clearAllButton.addEventListener("click", () => {
  // Use confirm() for a simple confirmation dialog
  if (
    window.confirm(
      "Are you sure you want to clear ALL custom names? This cannot be undone."
    )
  ) {
    chrome.storage.sync.remove(STORAGE_KEY, () => {
      // **GOOD:** Check for errors removing data
      if (chrome.runtime.lastError) {
        showMessage(
          `Error clearing overrides: ${chrome.runtime.lastError.message}`,
          true
        );
      } else {
        showMessage("All tacks cleared!");
        originalNameInput.value = ""; // Also clear inputs here
        newNameInput.value = "";
        originalNameInput.focus();
        notifyContentScript(); // Tell content script to update UI
      }
    });
  }
});

// Add event listener for Enter key on the last input field to trigger save
newNameInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default potentially unwanted actions
    saveButton.click(); // Trigger the save button's click handler
  }
});

// Ensure message area is initially hidden
messageElement.style.visibility = "hidden";
