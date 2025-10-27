import React, { useEffect } from "react";
import useChatStore from "../store/useChatStore";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatContainer = () => {
  const {
    selectedUser,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    messages,
    isMessagesLoading,
  } = useChatStore();

  useEffect(() => {
    if (!selectedUser?._id) return;

    let active = true;

    const setupChat = async () => {
      await getMessages(selectedUser._id);
      if (active) subscribeToMessages(selectedUser._id);
    };

    setupChat();

    return () => {
      active = false;
      unsubscribeFromMessages(selectedUser._id);
    };
  }, [selectedUser?._id]);

  if (!selectedUser) {
    return (
      <div className="chat-empty">
        <h2>Select a user to start chatting</h2>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">{selectedUser.fullName}</div>

      {isMessagesLoading ? (
        <p className="loading">Loading messages...</p>
      ) : (
        <MessageList messages={messages} />
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;