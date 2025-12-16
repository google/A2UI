/*
 * Personalized Learning Demo - Main Entry Point
 *
 * This is the main orchestrator for the personalized learning demo.
 * It handles chat interactions, calls the A2A agent for A2UI content,
 * and renders everything in a chat-style interface.
 */

// Import A2UI web components (registers custom elements, including QuizCard)
import "@a2ui/web-lib/ui";

import { ChatOrchestrator } from "./chat-orchestrator";
import { A2UIRenderer } from "./a2ui-renderer";

// Initialize the application
async function init() {
  console.log("[Demo] Initializing...");

  // Initialize the A2UI renderer
  const renderer = new A2UIRenderer();

  // Initialize the chat orchestrator
  const orchestrator = new ChatOrchestrator(renderer);

  // Set up UI event handlers
  setupEventHandlers(orchestrator);

  console.log("[Demo] Ready!");
}

function setupEventHandlers(orchestrator: ChatOrchestrator) {
  const chatInput = document.getElementById("chatInput") as HTMLTextAreaElement;
  const sendBtn = document.getElementById("sendBtn") as HTMLButtonElement;
  const chatArea = document.getElementById("chatArea") as HTMLDivElement;

  // Auto-resize textarea
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + "px";

    // Enable/disable send button
    sendBtn.disabled = chatInput.value.trim() === "";
  });

  // Send on Enter (without Shift)
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.value.trim()) {
        sendMessage(orchestrator, chatInput, chatArea);
      }
    }
  });

  // Send on button click
  sendBtn.addEventListener("click", () => {
    if (chatInput.value.trim()) {
      sendMessage(orchestrator, chatInput, chatArea);
    }
  });

  // Handle suggestion chips
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      if (prompt) {
        chatInput.value = prompt;
        chatInput.dispatchEvent(new Event("input"));
        sendMessage(orchestrator, chatInput, chatArea);
      }
    });
  });
}

async function sendMessage(
  orchestrator: ChatOrchestrator,
  input: HTMLTextAreaElement,
  chatArea: HTMLDivElement
) {
  const message = input.value.trim();
  if (!message) return;

  // Clear input
  input.value = "";
  input.style.height = "auto";
  (document.getElementById("sendBtn") as HTMLButtonElement).disabled = true;

  // Hide welcome screen if visible
  const welcomeScreen = chatArea.querySelector(".welcome-screen");
  if (welcomeScreen) {
    welcomeScreen.remove();
  }

  // Add user message
  addUserMessage(chatArea, message);

  // Add assistant message placeholder with typing indicator
  const assistantMessage = addAssistantMessagePlaceholder(chatArea);

  // Scroll to bottom
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    // Process the message through the orchestrator
    await orchestrator.processMessage(message, assistantMessage);
  } catch (error) {
    console.error("[Demo] Error processing message:", error);
    setAssistantMessageError(
      assistantMessage,
      "I'm sorry, I encountered an error. Please try again."
    );
  }

  // Scroll to bottom again after response
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addUserMessage(chatArea: HTMLDivElement, message: string) {
  const messageEl = document.createElement("div");
  messageEl.className = "message user";
  messageEl.innerHTML = `
    <div class="message-avatar">M</div>
    <div class="message-content">
      <div class="message-sender">You</div>
      <div class="message-text">${escapeHtml(message)}</div>
    </div>
  `;
  chatArea.appendChild(messageEl);
}

function addAssistantMessagePlaceholder(chatArea: HTMLDivElement): HTMLDivElement {
  const messageEl = document.createElement("div");
  messageEl.className = "message assistant";
  messageEl.innerHTML = `
    <div class="message-avatar">
      <span class="material-symbols-outlined">auto_awesome</span>
    </div>
    <div class="message-content">
      <div class="message-sender">Gemini</div>
      <div class="message-text">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  chatArea.appendChild(messageEl);
  return messageEl;
}

function setAssistantMessageError(messageEl: HTMLDivElement, error: string) {
  const textEl = messageEl.querySelector(".message-text");
  if (textEl) {
    textEl.innerHTML = `<p style="color: #f87171;">${escapeHtml(error)}</p>`;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Start the app
init();
