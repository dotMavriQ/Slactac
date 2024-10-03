// Handle the "Save" button click event
document.getElementById("save").addEventListener("click", () => {
  const originalName = document.getElementById("original-name").value.trim();
  const newName = document.getElementById("new-name").value.trim();
  const messageElement = document.getElementById("message");

  if (originalName && newName) {
    // Get existing overrides from storage
    chrome.storage.sync.get("chatRoomOverrides", (data) => {
      const overrides = data.chatRoomOverrides || {};
      overrides[originalName] = newName;

      // Save the new override
      chrome.storage.sync.set({ chatRoomOverrides: overrides }, () => {
        messageElement.textContent = "Name override saved!";
        messageElement.style.color = "#b8bb26"; // Gruvbox green

        // Clear input fields
        document.getElementById("original-name").value = "";
        document.getElementById("new-name").value = "";
      });
    });
  } else {
    // Show error message
    messageElement.textContent = "Please fill out both fields.";
    messageElement.style.color = "#fb4934"; // Gruvbox red
  }
});

// Handle the "Clear All Tacks" button click event
document.getElementById("clear-all").addEventListener("click", () => {
  // Confirm with the user before clearing
  if (window.confirm("Are you sure you want to clear all tacks?")) {
    // Clear all overrides from storage
    chrome.storage.sync.remove("chatRoomOverrides", () => {
      const messageElement = document.getElementById("message");
      messageElement.textContent = "All tacks have been cleared!";
      messageElement.style.color = "#b8bb26"; // Gruvbox green
    });
  }
});
