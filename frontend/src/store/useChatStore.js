import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

const useChatStore = create((set, get) => ({
  selectedUser: null,
  messages: [],
  isMessagesLoading: false,

  // ✅ --- User selection
  setSelectedUser: (user) => set({ selectedUser: user, messages: [] }),

  // ✅ --- Fetch messages safely
  getMessages: async (userId) => {
    try {
      set({ isMessagesLoading: true });
      const res = await axios.get(`/api/messages/${userId}`);
      set({ messages: res.data, isMessagesLoading: false });
    } catch (err) {
      console.error("Error fetching messages:", err);
      set({ isMessagesLoading: false });
    }
  },

  // ✅ --- Subscribe to messages (prevent multiple listeners)
  subscribeToMessages: (userId) => {
    const { selectedUser } = get();

    if (!selectedUser?._id) return;

    // Remove existing listener before adding new one
    socket.off("newMessage");

    const handleNewMessage = (message) => {
      // Ensure message belongs to current chat
      if (message.senderId === selectedUser._id || message.receiverId === selectedUser._id) {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);

    // Store reference for unsubscribe
    set({ unsubscribeLocal: () => socket.off("newMessage", handleNewMessage) });
  },

  // ✅ --- Unsubscribe cleanly
  unsubscribeFromMessages: () => {
    const { unsubscribeLocal } = get();
    if (typeof unsubscribeLocal === "function") {
      unsubscribeLocal();
      set({ unsubscribeLocal: null });
    }
  },
}));

export default useChatStore;