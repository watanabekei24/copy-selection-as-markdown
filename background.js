chrome.commands.onCommand.addListener(async (command) => {
    if (command === "copy_as_markdown") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "copyMarkdown" });
      }
    }
  });