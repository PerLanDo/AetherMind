import React, { useEffect, useRef, useState } from "react";
import { researchAPI } from "../../../api"; // Adjust the import based on your project structure
import "./ChatInterface.css"; // Import your CSS file for styling
import { formatTime } from "../../../utils"; // Utility function to format timestamps

const ChatInterface = ({ projectId }) => {
  const [messages, setMessages] = useState([]); // Empty array instead of placeholder messages
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      fetchChatHistory();
      connectToWebSocket();
    }
  }, [projectId]);

  const fetchChatHistory = async () => {
    try {
      const response = await researchAPI.getChatHistory(projectId);
      setMessages(response.data || []); // Use actual data or empty array
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      setMessages([]); // Keep empty on error
    }
  };

  const connectToWebSocket = () => {
    // Connect to real WebSocket for live collaboration
    const ws = new WebSocket(
      `${process.env.REACT_APP_WS_URL}/research/${projectId}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "member_count") {
        setOnlineMembers(data.count);
      }
    };

    return () => ws.close();
  };

  const renderEmptyState = () => (
    <div className="chat-empty-state">
      <div className="empty-icon">💬</div>
      <h3>Welcome to your research assistant!</h3>
      <p>
        Start a conversation to analyze documents, brainstorm ideas, or get
        research help.
      </p>
      <div className="suggested-prompts">
        <button
          onClick={() => setInputMessage("Help me analyze uploaded documents")}
        >
          📄 Analyze documents
        </button>
        <button
          onClick={() => setInputMessage("Suggest research methodologies")}
        >
          🔬 Research methods
        </button>
        <button onClick={() => setInputMessage("Help me organize my findings")}>
          📊 Organize findings
        </button>
      </div>
    </div>
  );

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Research Assistant</h3>
        <span className="online-status">
          {onlineMembers > 0 &&
            `${onlineMembers} member${onlineMembers > 1 ? "s" : ""} online`}
        </span>
      </div>

      <div className="chat-messages">
        {messages.length === 0
          ? renderEmptyState()
          : messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.sender === "ai" ? "ai-message" : "user-message"
                }`}
              >
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputMessage.trim() !== "") {
              // Handle send message
              // ...existing send logic...
            }
          }}
        />
        {isTyping && <div className="typing-indicator">AI is typing...</div>}
      </div>
    </div>
  );
};

export default ChatInterface;
