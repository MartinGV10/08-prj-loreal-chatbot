/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// System prompt: guides the chatbot to only answer questions about L'Oréal products, routines, and recommendations
const systemPrompt =
  "You are a helpful assistant for L’Oréal. Only answer questions related to L’Oréal products, beauty routines, product recommendations, or beauty-related topics. If asked about anything else, politely refuse and say: 'I'm sorry, I can only answer questions about L’Oréal products, routines, recommendations, or beauty topics.'";

// Store chat history as an array of messages
let messages = [{ role: "system", content: systemPrompt }];

// Track user's name and past questions for context
let userName = ""; // Will store user's name if provided
let pastQuestions = []; // Will store user's previous questions

// Show initial greeting
chatWindow.innerHTML = `<div class="msg ai">👋 Hello! How can I help you today?</div>`;

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's message from input
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Add user's message to chat window as a user bubble
  chatWindow.innerHTML += `<div class="msg user">${userMessage}</div>`;

  // Check if user is providing their name (simple detection)
  if (!userName) {
    // If user says "My name is ..." or "I'm ..." or "I am ..."
    const nameMatch = userMessage.match(
      /(?:my name is|i'm|i am)\s+([a-zA-Z]+)/i
    );
    if (nameMatch) {
      userName = nameMatch[1];
      chatWindow.innerHTML += `<div class="msg ai">Nice to meet you, ${userName}! How can I assist you today?</div>`;
      // Add user's message to messages array
      messages.push({ role: "user", content: userMessage });
      // Add context about user's name for the assistant
      messages.push({
        role: "system",
        content: `The user's name is ${userName}.`,
      });
      userInput.value = "";
      chatWindow.scrollTop = chatWindow.scrollHeight;
      return;
    }
  }

  // Add user's message to messages array
  messages.push({ role: "user", content: userMessage });

  // Track past questions for context
  pastQuestions.push(userMessage);

  // Add context about past questions for the assistant
  // Only add the last 3 questions for brevity
  if (pastQuestions.length > 0) {
    const recentQuestions = pastQuestions.slice(-3).join(" | ");
    messages.push({
      role: "system",
      content: `Here are the user's recent questions: ${recentQuestions}`,
    });
  }

  // Clear input box
  userInput.value = "";

  // Show loading message as an assistant bubble
  chatWindow.innerHTML += `<div class="msg ai">...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Get OpenAI API key from secrets.js
  // (Make sure secrets.js is loaded in index.html)
  const apiKey = typeof OPENAI_API_KEY !== "undefined" ? OPENAI_API_KEY : "";

  // Prepare request data for OpenAI API
  const requestData = {
    model: "gpt-4o",
    messages: messages,
    max_tokens: 300,
  };

  try {
    // Send POST request directly to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header with API key
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    // Get chatbot's reply
    const aiReply =
      data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : "Sorry, I couldn't get a response. Please try again.";

    // Add chatbot's reply to chat window as an assistant bubble
    // Remove loading message first
    const msgs = chatWindow.querySelectorAll(".msg.ai");
    if (msgs.length) {
      msgs[msgs.length - 1].remove();
    }
    chatWindow.innerHTML += `<div class="msg ai">${aiReply}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Add chatbot's reply to messages array
    messages.push({ role: "assistant", content: aiReply });
  } catch (error) {
    // Show error message in chat window as an assistant bubble
    const msgs = chatWindow.querySelectorAll(".msg.ai");
    if (msgs.length) {
      msgs[msgs.length - 1].remove();
    }
    chatWindow.innerHTML += `<div class="msg ai">Sorry, there was a problem connecting to the chatbot.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
