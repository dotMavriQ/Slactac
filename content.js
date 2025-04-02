console.log("SLACTAC Content Script STARTING - Top of file");

// --- SLACTAC Name Overriding Variables & Functions ---
function overrideChatroomNames() {
  // Load saved overrides from Chrome storage
  chrome.storage.sync.get("chatRoomOverrides", (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        `SLACTAC Error getting overrides: ${chrome.runtime.lastError.message}`
      );
      return;
    }
    const overrides = data.chatRoomOverrides || {};
    const sidebarSelector = ".p-channel_sidebar__list"; // Optional improvement
    const nameOverrideSelector = ".p-channel_sidebar__name"; // Selector for channel names
    const listContainer = document.querySelector(sidebarSelector);

    const nameElements = listContainer
      ? listContainer.querySelectorAll(nameOverrideSelector)
      : document.querySelectorAll(nameOverrideSelector);

    nameElements.forEach((element) => {
      if (!element.dataset.originalNameSlactac) {
        element.dataset.originalNameSlactac = element.innerText.trim();
      }
      const originalName = element.dataset.originalNameSlactac;
      if (overrides[originalName]) {
        if (element.innerText.trim() !== overrides[originalName]) {
          element.innerText = overrides[originalName];
        }
      } else {
        if (element.innerText.trim() !== originalName) {
          element.innerText = originalName;
        }
      }
    });
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedOverrideNames = debounce(overrideChatroomNames, 300);

// ============================================================
// --- Channel Picker Logic with Darken/Blur Effect ---
// ============================================================

let channelPickerActive = false;
let originalCursor = null;
const overlayContainerId = "slactac-overlay-container";
const highlightedElementClass = "slactac-picker-highlighted-target";
let currentHighlightedElement = null;

// --- Picker Utility Functions ---
function createPickerOverlays() {
  let container = document.getElementById(overlayContainerId);
  if (container) {
    container.style.display = "block";
    return;
  }
  container = document.createElement("div");
  container.id = overlayContainerId;
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.zIndex = "2147483646";
  container.style.pointerEvents = "none";

  const overlayStyles = `
      position: absolute;
      background-color: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(1.5px);
      transition: all 0.05s ease-out;
    `;
  ["top", "bottom", "left", "right"].forEach((pos) => {
    const overlay = document.createElement("div");
    overlay.id = `slactac-picker-overlay-${pos}`;
    overlay.style.cssText = overlayStyles;
    container.appendChild(overlay);
  });
  document.body.appendChild(container);
  console.log("SLACTAC Picker: Overlays created.");
}

function removePickerOverlays() {
  const container = document.getElementById(overlayContainerId);
  if (container) {
    container.remove();
    console.log("SLACTAC Picker: Overlays removed.");
  }
  if (currentHighlightedElement) {
    currentHighlightedElement.classList.remove(highlightedElementClass);
    currentHighlightedElement.style.position = "";
    currentHighlightedElement.style.zIndex = "";
    currentHighlightedElement = null;
  }
}

function getElementUnderCursor(event) {
  const container = document.getElementById(overlayContainerId);
  let originalDisplay = "";
  if (container) {
    originalDisplay = container.style.display;
    container.style.display = "none";
  }
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (container) {
    container.style.display = originalDisplay;
  }
  return element;
}

function findTargetChannelItemElement(startElement) {
  if (!startElement || startElement.id?.startsWith("slactac-picker-overlay"))
    return null;
  if (
    startElement === document.body ||
    startElement === document.documentElement
  )
    return null;
  const rect = startElement.getBoundingClientRect();
  if (
    rect.width < 2 ||
    rect.height < 2 ||
    rect.width > window.innerWidth * 0.8 ||
    rect.height > window.innerHeight * 0.8
  ) {
    return null;
  }
  return startElement;
}

function highlightPickerElement(element) {
  const container = document.getElementById(overlayContainerId);
  if (!container) return;
  const overlayTop = document.getElementById("slactac-picker-overlay-top");
  const overlayBottom = document.getElementById(
    "slactac-picker-overlay-bottom"
  );
  const overlayLeft = document.getElementById("slactac-picker-overlay-left");
  const overlayRight = document.getElementById("slactac-picker-overlay-right");

  if (currentHighlightedElement && currentHighlightedElement !== element) {
    currentHighlightedElement.classList.remove(highlightedElementClass);
    currentHighlightedElement.style.position = "";
    currentHighlightedElement.style.zIndex = "";
    currentHighlightedElement = null;
  }
  if (!element) {
    overlayTop.style.height = "100%";
    overlayTop.style.width = "100%";
    overlayTop.style.top = "0";
    overlayTop.style.left = "0";
    overlayBottom.style.height = "0";
    overlayLeft.style.height = "0";
    overlayRight.style.height = "0";
    if (currentHighlightedElement) {
      currentHighlightedElement.classList.remove(highlightedElementClass);
      currentHighlightedElement.style.position = "";
      currentHighlightedElement.style.zIndex = "";
      currentHighlightedElement = null;
    }
    return;
  }
  if (element !== currentHighlightedElement) {
    element.style.position = "relative";
    element.style.zIndex = "2147483647";
    element.classList.add(highlightedElementClass);
    currentHighlightedElement = element;
  }
  const rect = element.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  overlayTop.style.top = `0px`;
  overlayTop.style.left = `0px`;
  overlayTop.style.width = `${vw}px`;
  overlayTop.style.height = `${rect.top}px`;
  overlayBottom.style.top = `${rect.bottom}px`;
  overlayBottom.style.left = `0px`;
  overlayBottom.style.width = `${vw}px`;
  overlayBottom.style.height = `${vh - rect.bottom}px`;
  overlayLeft.style.top = `${rect.top}px`;
  overlayLeft.style.left = `0px`;
  overlayLeft.style.width = `${rect.left}px`;
  overlayLeft.style.height = `${rect.height}px`;
  overlayRight.style.top = `${rect.top}px`;
  overlayRight.style.left = `${rect.right}px`;
  overlayRight.style.width = `${vw - rect.right}px`;
  overlayRight.style.height = `${rect.height}px`;
}

// --- Updated Extraction Function ---
function extractPickerChannelName(targetElement) {
  if (!targetElement) return null;
  let pickedText = targetElement.innerText;
  pickedText = pickedText.trim();
  if (!pickedText || pickedText.length < 1) {
    return null;
  }
  return pickedText;
}

// --- Picker Event Handlers ---
function channelPickerMouseMoveHandler(event) {
  if (!channelPickerActive) return;
  const elementUnderCursor = getElementUnderCursor(event);
  const targetElement = findTargetChannelItemElement(elementUnderCursor);
  highlightPickerElement(targetElement);
}

function channelPickerClickHandler(event) {
  if (!channelPickerActive) return;
  event.preventDefault();
  event.stopPropagation();
  const targetElement = currentHighlightedElement;
  console.log(
    "SLACTAC Picker (Simple w/ FX): Click detected. Target element:",
    targetElement
  );
  let pickedText = null;
  if (targetElement) {
    pickedText = extractPickerChannelName(targetElement);
  }
  if (pickedText) {
    console.log(`SLACTAC Picker (Simple w/ FX): Picked text: "${pickedText}"`);
    // Store the picked channel name in local storage immediately.
    chrome.storage.local.set({ lastPickedChannelName: pickedText }, () => {
      console.log("SLACTAC: Stored lastPickedChannelName in local storage.");
    });
    // Also send a message (for real-time update if popup is open)
    chrome.runtime.sendMessage({
      action: "channelPicked",
      channelName: pickedText,
    });
  } else {
    console.log(
      "SLACTAC Picker (Simple w/ FX): No suitable text found on highlighted element:",
      targetElement
    );
  }
  // Always deactivate after a click attempt.
  deactivateChannelPicker(false);
  return false;
}

// --- Picker Activation/Deactivation ---
function isSlackPage() {
  return window.location.hostname.includes("app.slack.com");
}

function activateChannelPicker() {
  if (channelPickerActive) {
    console.log("SLACTAC Picker: Already active.");
    return true;
  }
  if (!isSlackPage()) {
    console.warn("SLACTAC: Not on a Slack page, cannot activate picker.");
    return false;
  }
  console.log("SLACTAC Picker: Activating with visual effects...");
  channelPickerActive = true;
  originalCursor = document.body.style.cursor;
  document.body.style.cursor = "crosshair";
  createPickerOverlays();
  highlightPickerElement(null);
  document.addEventListener("mousemove", channelPickerMouseMoveHandler, true);
  document.addEventListener("click", channelPickerClickHandler, true);
  console.log("SLACTAC Picker: Activated with visual effects.");
  return true;
}

function deactivateChannelPicker(notifyPopup = true) {
  if (!channelPickerActive) return;
  console.log("SLACTAC Picker: Deactivating with visual effects...");
  channelPickerActive = false;
  document.body.style.cursor = originalCursor || "";
  removePickerOverlays();
  document.removeEventListener(
    "mousemove",
    channelPickerMouseMoveHandler,
    true
  );
  document.removeEventListener("click", channelPickerClickHandler, true);
  console.log("SLACTAC Picker: Deactivated with visual effects.");
  if (notifyPopup) {
    try {
      chrome.runtime.sendMessage({ action: "pickerDeactivated" });
    } catch (e) {
      if (!e.message.includes("Receiving end does not exist")) {
        console.warn("SLACTAC Picker: Error sending deactivate message:", e);
      }
    }
  }
}

// ============================================================
// --- End of Picker Logic ---
// ============================================================

// --- Initial Name Override & Observer Setup ---
overrideChatroomNames();
const observer = new MutationObserver((mutationsList, observer) => {
  let potentiallyRelevantChange = false;
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          const nameOverrideSelector = ".p-channel_sidebar__name";
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches(nameOverrideSelector) ||
              node.querySelector(nameOverrideSelector))
          ) {
            potentiallyRelevantChange = true;
            break;
          }
        }
      }
      if (mutation.removedNodes.length > 0) {
        potentiallyRelevantChange = true;
      }
    }
    if (potentiallyRelevantChange) break;
  }
  if (potentiallyRelevantChange) {
    debouncedOverrideNames();
  }
});
const sidebarTargetSelector = ".p-channel_sidebar__list";
const targetNode =
  document.querySelector(sidebarTargetSelector) || document.body;
console.log(
  `SLACTAC: Observing ${
    targetNode === document.body
      ? "document.body (fallback)"
      : sidebarTargetSelector
  } for changes (Name Override).`
);
observer.observe(targetNode, { childList: true, subtree: true });

// --- Combined Message Listener ---
console.log("SLACTAC CONTENT SCRIPT: Setting up message listener...");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("SLACTAC CONTENT SCRIPT: Message received -> ", request.action);
  if (request.action === "refreshNamesSLACTAC") {
    console.log("SLACTAC: Handling refreshNamesSLACTAC");
    overrideChatroomNames();
    sendResponse({ status: "Names refreshed by content script." });
    return true;
  } else if (request.action === "activateChannelPicker") {
    console.log("SLACTAC: Handling activateChannelPicker (with visual FX)");
    const activated = activateChannelPicker();
    sendResponse({
      success: activated,
      status: activated
        ? "Picker Activated (FX)"
        : "Failed to activate picker (FX)",
    });
    return true;
  } else if (request.action === "deactivateChannelPicker") {
    console.log("SLACTAC: Handling deactivateChannelPicker (with visual FX)");
    deactivateChannelPicker();
    sendResponse({
      success: true,
      status: "Picker Deactivated by request (FX)",
    });
    return true;
  }
  console.log("SLACTAC: Unknown message action received:", request.action);
  return false;
});

// --- Cleanup on Load ---
removePickerOverlays();
if (document.body.style.cursor === "crosshair") {
  console.warn("SLACTAC: Found crosshair cursor on load, resetting.");
  document.body.style.cursor = "";
}
console.log("SLACTAC: Content script fully initialized.");
