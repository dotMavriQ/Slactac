console.log("SLACTAC Content Script STARTING - Top of file");

// --- SLACTAC Name Overriding Variables & Functions ---
function overrideChatroomNames() {
  // Load saved overrides from storage
  storage.get().then((overrides) => {
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
  }).catch(error => {
    console.error("SLACTAC: Failed to get overrides for name replacement.", error);
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
let currentHighlightedNameElement = null;
let defaultHighlightedRegion = null;
let channelPickerProcessing = false;
let pickerFailsafeTimer = null;
const LOCAL_PICK_KEY = "lastPickedChannelName";

const CHANNEL_LIST_SELECTORS = [
  ".p-channel_sidebar__static_list",
  ".p-channel_sidebar__list",
  "[data-qa='channel_sidebar']",
  "[data-qa='slack_kit_list']",
  ".p-channel_sidebar",
  ".p-workspace__sidebar"
];

const CHANNEL_ITEM_SELECTORS = [
  "[data-qa='channel_sidebar_channel']",
  "[data-qa-channel-sidebar-channel-id]",
  "[role='treeitem']",
  ".p-channel_sidebar__channel",
  ".p-channel_sidebar__static_channel",
  ".p-channel_sidebar__link"
];

const CHANNEL_NAME_SELECTORS = [
  ".p-channel_sidebar__name",
  "[data-qa='channel_sidebar_channel_name']",
  "[data-qa='channel_sidebar_name']",
  "[data-qa^='channel_sidebar_name_']",
  "[data-qa^='channel_sidebar_channel_name_']"
];

function storePickedChannelName(name) {
  return new Promise((resolve, reject) => {
    const sanitizedName = typeof name === "string" ? name.trim() : "";
    if (!sanitizedName) {
      chrome.storage.local.remove(LOCAL_PICK_KEY, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
      return;
    }
    chrome.storage.local.set({ [LOCAL_PICK_KEY]: sanitizedName }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

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
    currentHighlightedNameElement = null;
  }
  defaultHighlightedRegion = null;
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

function matchFirstSelector(element, selectors) {
  if (!element) return null;
  for (const selector of selectors) {
    if (element.matches && element.matches(selector)) {
      return element;
    }
  }
  return null;
}

function queryFirstSelector(selectors, root = document) {
  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) {
      return found;
    }
  }
  return null;
}

function getChannelSidebarContainer() {
  return queryFirstSelector(CHANNEL_LIST_SELECTORS);
}

function findNearestChannelNameElement(element) {
  let current = element;
  while (current && current !== document.body && current !== document.documentElement) {
    const matched = matchFirstSelector(current, CHANNEL_NAME_SELECTORS);
    if (matched) {
      return matched;
    }
    current = current.parentElement;
  }
  return null;
}

function findEnclosingChannelItem(element) {
  if (!element) return null;
  if (!element.closest) return null;
  const selector = CHANNEL_ITEM_SELECTORS.join(", ");
  return element.closest(selector);
}

function resolveChannelTarget(startElement) {
  if (!startElement || startElement.id?.startsWith("slactac-picker-overlay")) {
    return null;
  }

  if (startElement.nodeType !== Node.ELEMENT_NODE) {
    startElement = startElement.parentElement;
  }

  if (!startElement) {
    return null;
  }

  const sidebar = getChannelSidebarContainer();
  if (sidebar && !sidebar.contains(startElement)) {
    return null;
  }

  // Strategy: Find the encompassing channel item first.
  const channelItem = findEnclosingChannelItem(startElement);

  if (channelItem) {
    // Now find the name within that item.
    let nameElement = queryFirstSelector(CHANNEL_NAME_SELECTORS, channelItem);

    // If no specific name selector matches, find the most likely text node.
    if (!nameElement) {
      const textElements = Array.from(channelItem.querySelectorAll("span, div"));
      const bestCandidate = textElements.find(
        (el) => el.innerText && el.innerText.trim().length > 0
      );
      nameElement = bestCandidate || channelItem;
    }

    return {
      highlightElement: channelItem,
      nameElement: nameElement,
    };
  }

  // Fallback for elements not inside a clear item, but maybe are the item itself.
  if (matchFirstSelector(startElement, CHANNEL_ITEM_SELECTORS)) {
    const nameElement =
      queryFirstSelector(CHANNEL_NAME_SELECTORS, startElement) || startElement;
    return {
      highlightElement: startElement,
      nameElement: nameElement,
    };
  }

  return null;
}

function highlightDefaultChannelRegion() {
  const sidebar = getChannelSidebarContainer();
  defaultHighlightedRegion = sidebar || null;
  if (sidebar) {
    highlightPickerElement(sidebar, null, { isDefault: true });
  } else {
    highlightPickerElement(null, null, { isDefault: true });
  }
}

function highlightPickerElement(element, nameElement = null, options = {}) {
  const { isDefault = false } = options;
  const container = document.getElementById(overlayContainerId);
  if (!container) return;
  if (element && element.nodeType !== Node.ELEMENT_NODE) {
    element = element.parentElement || null;
  }
  const overlayTop = document.getElementById("slactac-picker-overlay-top");
  const overlayBottom = document.getElementById(
    "slactac-picker-overlay-bottom"
  );
  const overlayLeft = document.getElementById("slactac-picker-overlay-left");
  const overlayRight = document.getElementById("slactac-picker-overlay-right");

  if (currentHighlightedElement && currentHighlightedElement !== element) {
    if (currentHighlightedElement === defaultHighlightedRegion) {
      defaultHighlightedRegion = null;
    }
    currentHighlightedElement.classList.remove(highlightedElementClass);
    currentHighlightedElement.style.position = "";
    currentHighlightedElement.style.zIndex = "";
    currentHighlightedElement = null;
    currentHighlightedNameElement = null;
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
      currentHighlightedNameElement = null;
    }
    return;
  }
  if (element !== currentHighlightedElement) {
    element.style.position = "relative";
    element.style.zIndex = "2147483647";
    element.classList.add(highlightedElementClass);
    currentHighlightedElement = element;
  }
  currentHighlightedNameElement = nameElement;
  if (isDefault) {
    defaultHighlightedRegion = element;
  } else if (element !== defaultHighlightedRegion) {
    defaultHighlightedRegion = null;
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
function extractPickerChannelName(nameElement, fallbackElement = null) {
  const element = nameElement || fallbackElement;
  if (!element) return null;
  const textSource =
    typeof element.innerText === "string"
      ? element.innerText
      : typeof element.textContent === "string"
      ? element.textContent
      : "";
  const pickedText = textSource.trim();
  if (!pickedText || pickedText.length < 1) {
    return null;
  }
  return pickedText;
}

// --- Picker Event Handlers ---
function channelPickerMouseMoveHandler(event) {
  if (!channelPickerActive) return;
  const elementUnderCursor = getElementUnderCursor(event);
  const target = resolveChannelTarget(elementUnderCursor);
  if (target) {
    highlightPickerElement(target.highlightElement, target.nameElement);
  } else {
    highlightDefaultChannelRegion();
  }
}

async function channelPickerClickHandler(event) {
  if (!channelPickerActive || channelPickerProcessing) {
    return;
  }

  console.log("SLACTAC Picker: Click detected. Processing...");
  channelPickerProcessing = true;
  event.preventDefault();
  event.stopPropagation();

  // Deactivate picker visuals immediately for a responsive feel
  deactivateChannelPicker();

  const target = resolveChannelTarget(event.target);
  const channelName = extractPickerChannelName(
    target ? target.nameElement : null,
    target ? target.highlightElement : null
  );

  try {
    if (channelName) {
      console.log(`SLACTAC Picker: Storing channel name: ${channelName}`);
      await storePickedChannelName(channelName);
      console.log("SLACTAC Picker: Stored picked channel in local storage.");
    } else {
      console.warn(
        "SLACTAC Picker: Clicked on a non-channel element. No action taken."
      );
    }
  } catch (error) {
    console.error("SLACTAC Picker: Error during click handler execution:", error);
  } finally {
    console.log("SLACTAC Picker: Click processing finished.");
    channelPickerProcessing = false;
  }
}

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
  highlightDefaultChannelRegion();
  document.addEventListener("mousemove", channelPickerMouseMoveHandler, true);
  document.addEventListener("click", channelPickerClickHandler, true);
  document.addEventListener("keydown", handleKeyDown, true);

  // Failsafe: If the picker is active for too long, deactivate it automatically.
  pickerFailsafeTimer = setTimeout(() => {
    console.warn("SLACTAC Picker: Failsafe timer triggered. Deactivating picker automatically.");
    deactivateChannelPicker(true);
  }, 15000); // 15 seconds

  console.log("SLACTAC Picker: Activated with visual effects.");
  return true;
}

function deactivateChannelPicker(force = false) {
  if (!channelPickerActive && !force) {
    return;
  }
  console.log("SLACTAC Picker: Deactivating...");
  channelPickerActive = false;
  document.body.style.cursor = originalCursor;
  removePickerOverlays();
  document.removeEventListener("mousemove", channelPickerMouseMoveHandler, true);
  document.removeEventListener("click", channelPickerClickHandler, true);
  document.removeEventListener("keydown", handleKeyDown, true);

  // Clear the failsafe timer
  if (pickerFailsafeTimer) {
    clearTimeout(pickerFailsafeTimer);
    pickerFailsafeTimer = null;
  }

  console.log("SLACTAC Picker: Deactivated.");
}

function handleKeyDown(event) {
  if (channelPickerActive && event.key === "Escape") {
    console.log("SLACTAC Picker: Escape key pressed. Deactivating picker.");
    deactivateChannelPicker(true);
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
