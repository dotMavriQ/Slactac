// content.js

// Function to override chatroom names
function overrideChatroomNames() {
  // Load saved overrides from Chrome storage
  chrome.storage.sync.get("chatRoomOverrides", (data) => {
    // **GOOD:** Handles potential errors during storage retrieval
    if (chrome.runtime.lastError) {
      console.error(
        `SLACTAC Error getting overrides: ${chrome.runtime.lastError.message}`
      );
      return;
    }
    
    // Validate storage data format
    if (!data || typeof data !== 'object') {
      console.error('SLACTAC: Invalid storage data format');
      return;
    }
    
    // Ensure overrides is an object and sanitize data
    const overrides = (data.chatRoomOverrides && typeof data.chatRoomOverrides === 'object') ? 
      data.chatRoomOverrides : {};
      
    // Extra protection: validate all keys and values to prevent code injection
    for (const key in overrides) {
      if (!overrides.hasOwnProperty(key)) continue;
      
      // Remove any non-string values or potentially dangerous content
      if (typeof overrides[key] !== 'string' || 
          /<script|javascript:|data:/i.test(overrides[key])) {
        console.warn(`SLACTAC: Removed suspicious override for "${key}"`); 
        delete overrides[key];
      }
    }
    const sidebarSelector = ".p-channel_sidebar__list"; // **IMPROVEMENT:** Attempt to find a more specific container for the channel list
    const listContainer = document.querySelector(sidebarSelector);

    // **IMPROVEMENT:** Query within the specific container if found, otherwise fallback to the whole document
    // This helps if the selector is specific enough for names outside the main list.
    const nameElements = listContainer
      ? listContainer.querySelectorAll(".p-channel_sidebar__name")
      : document.querySelectorAll(".p-channel_sidebar__name");

    // **IMPROVEMENT:** Keep track of which elements were modified to potentially revert later if needed
    // We'll store the original name directly on the element using a data attribute.
    nameElements.forEach((element) => {
      // Store original name if not already stored
      if (!element.dataset.originalNameSlactac) {
        element.dataset.originalNameSlactac = element.innerText.trim();
      }

      const originalName = element.dataset.originalNameSlactac; // Use the stored original name

      // Sanitize content before displaying - prevents XSS if data from storage is compromised
      const sanitizeText = (text) => {
        if (typeof text !== 'string') return '';
        return text.replace(/[<>&"']/g, (match) => {
          const map = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#039;'
          };
          return map[match] || match;
        });
      };

      if (overrides.hasOwnProperty(originalName)) {
        // Safety check to ensure value is a string
        const newName = typeof overrides[originalName] === 'string' ? 
          overrides[originalName] : String(overrides[originalName]);
          
        // Apply override only if it's different from the current text
        if (element.innerText.trim() !== newName) {
          // Set as textContent for security - avoids HTML injection
          element.textContent = newName;
          // console.log(`SLACTAC: Overriding "${originalName}" with "${newName}"`); // Optional: for debugging
        }
      } else {
        // Revert to original name if no override exists and the text is currently different
        if (element.innerText.trim() !== originalName) {
          // Set as textContent for security - avoids HTML injection
          element.textContent = originalName;
          // console.log(`SLACTAC: Reverting "${element.innerText}" to original "${originalName}"`); // Optional: for debugging
        }
      }
    });
  });
}

// Debounce function to limit how often overrideChatroomNames is called
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

// **IMPROVEMENT:** Debounce the function call to prevent excessive runs on rapid DOM changes
const debouncedOverrideNames = debounce(overrideChatroomNames, 300); // Adjust delay (ms) as needed

// Run the override function on initial load
overrideChatroomNames();

// Set up a MutationObserver to catch changes
const observer = new MutationObserver((mutationsList, observer) => {
  // **IMPROVEMENT:** Check if the mutations *might* affect channel names before running the full function.
  // This is a basic check; more complex checks could look at added/removed nodes' classes.
  let potentiallyRelevantChange = false;
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      // Only care about added/removed nodes for simplicity
      // Check if added nodes *might* contain our target class (heuristic)
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          // Check if the node itself or its descendants might contain the class
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.classList.contains("p-channel_sidebar__name") ||
              node.querySelector(".p-channel_sidebar__name"))
          ) {
            potentiallyRelevantChange = true;
            break; // Found one, no need to check further in this mutation record
          }
        }
      }
      // A removed node could also be relevant if it was a container
      if (mutation.removedNodes.length > 0) {
        potentiallyRelevantChange = true; // Simpler to assume relevance on removal
      }
    }
    // If already found relevance, stop checking mutation records
    if (potentiallyRelevantChange) break;
  }

  if (potentiallyRelevantChange) {
    // console.log("SLACTAC: Detected potentially relevant DOM change, running debounced override."); // Optional: for debugging
    debouncedOverrideNames(); // Use the debounced function
  }
});

// **IMPROVEMENT:** Observe a more specific target if possible, fallback to body.
// NOTE: '.p-channel_sidebar__list' is an *example*. You MUST inspect Slack's
// actual HTML in your browser to find the most stable and specific container
// element that wraps the list of channels/DMs shown in the sidebar.
const sidebarTargetSelector = ".p-channel_sidebar__list"; // <--- INSPECT AND UPDATE THIS SELECTOR
const targetNode =
  document.querySelector(sidebarTargetSelector) || document.body;

console.log(
  `SLACTAC: Observing ${
    targetNode === document.body
      ? "document.body (fallback)"
      : sidebarTargetSelector
  } for changes.`
);

// Start observing the target node for configured mutations
observer.observe(targetNode, {
  childList: true, // Watch for nodes being added or removed
  subtree: true, // Watch descendants as well
});

// Listen for messages from popup.js for instant refresh with enhanced security
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Security check: Verify the message is from our extension
  if (!sender.id || sender.id !== chrome.runtime.id) {
    console.error("SLACTAC: Received message from unauthorized source");
    return false;
  }
  
  // Validate message format and content
  if (!request || typeof request !== "object") {
    console.error("SLACTAC: Invalid message format");
    return false;
  }
  
  if (request.action === "refreshNamesSLACTAC") {
    // Use a more specific action name
    console.log("SLACTAC: Received refresh request from popup.");
    overrideChatroomNames(); // Run immediately on request
    sendResponse({ status: "Names refreshed by content script.", success: true });
    return true; // Indicates you wish to send a response asynchronously
  }
  
  // Always send a response for unhandled messages to prevent hanging promises
  sendResponse({ error: "Unknown action", success: false });
  return false;
});
