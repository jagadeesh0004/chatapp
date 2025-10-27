import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // 🧩 Fetch all chat users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // 🧩 Fetch messages with selected user
  getMessages: async (userId) => {
    if (!userId) return;
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // 🧩 Send message (text or image)
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    if (!selectedUser?._id) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      // ✅ Always use functional update to prevent stale messages
      set((state) => ({ messages: [...state.messages, res.data] }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // 🧩 Real-time message listener
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Only add message if it’s from the currently selected user
      if (newMessage.senderId !== selectedUser._id) return;
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    };

    socket.on("newMessage", handleNewMessage);

    // 🧹 Clean up automatically when unsubscribing
    set({ unsubscribeHandler: () => socket.off("newMessage", handleNewMessage) });
  },

  // 🧩 Stop listening
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { unsubscribeHandler } = get();

    if (socket && unsubscribeHandler) {
      unsubscribeHandler(); // remove the specific handler
      set({ unsubscribeHandler: null });
    }
  },

  // 🧩 Set selected user
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));