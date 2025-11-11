document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");
  const chatEndpoint = "http://localhost:8000/chat";
  const typeme = document.querySelector('div.typeme');
  const output = document.querySelector('section.output')

  let intervalCount = 0

  typeme.addEventListener("animationend", () => {
    typeme.style.animation = "blink 1s step-end infinite";
  });

  output.addEventListener("animationend", () => {
    typeme.style.borderRight = 0;
    typeme.style.animation = "none";
    chatInput.focus();
  })

  function formatChatHistory(history) {
    formattedHistory = [];

    if (history.length == 0) {
      return [];
    }

    for (const message of history) {
      formattedHistory.push({
        role: message.classList.contains("user-message") ? "user" : "assistant",
        content: message.innerText
      });
    }
    return formattedHistory;
  }

  async function sendMessage(message, history) {
    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          "message": message,
          "history": history
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error sending message:", error);
      return "Sorry, something went wrong.";
    }
  }

  function appendMessage(sender, message) {
    const messageElement = document.createElement("div");

    if (sender === "user") {
      const secondaryText = document.createElement("span");
      const textBackground = document.createElement("span");
      const cursor = document.createElement("span");

      messageElement.classList.add("commandline");
      messageElement.classList.add("user-message");
      secondaryText.classList.add("text-secondary");
      textBackground.classList.add("text-background");
      cursor.classList.add("cursor");

      secondaryText.textContent = "brenntron@dev";
      textBackground.textContent = '~';
      cursor.textContent = "$";

      messageElement.appendChild(secondaryText);
      messageElement.appendChild(textBackground);
      messageElement.appendChild(cursor);
    } else {
      messageElement.classList.add("llm-message");
    }

    messageElement.appendChild(document.createTextNode(" " + message));
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  }

  function cycle(element, sequence) {
    element.textContent = sequence[intervalCount % sequence.length];
    intervalCount++;
  }

  function toggleLoader(isLoading=false, intervalId) {
    const sequence = ['-', '—', '--', '——', '---', '———', '---', '——', '--', '—'];
    const cycleInterval = 150; // milliseconds

    if (isLoading) {
      const loaderElement = document.createElement("span");

      loaderElement.classList.add("loader");
      chatBox.appendChild(loaderElement);

      return setInterval(cycle, cycleInterval, loaderElement, sequence);
    } else {
      clearInterval(intervalId);
      intervalCount = 0;
      document.querySelector('span.loader').remove();
    }
  }

  chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    const chatHistory = chatBox.children;

    // Display user message
    appendMessage("user", userMessage);

    const loaderInterval = toggleLoader(true);

    // Clear input
    chatInput.value = "";
    chatInput.disabled = true;

    const formattedChatHistory = formatChatHistory(chatHistory);

    // Fetch and display bot response
    const botReply = await sendMessage(userMessage, formattedChatHistory);
    toggleLoader(false, loaderInterval);
    appendMessage("llm", botReply);
    chatInput.disabled = false;
    chatInput.focus();
  });
});

