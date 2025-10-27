import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

/**
 * NOTE:
 * - we keep a local unsubscribe function (unsubscribeLocal) outside the zustand state
 *   to avoid writing it into the store (which would cause extra re-renders).
 * - subscribeToMessages always clears a previous subscription first.
 */

let unsubscribeLocal = null;

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Fetch all chat users
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

  // Fetch messages with selected user
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

  // Send message (text or image)
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    if (!selectedUser?._id) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      // functional update to avoid stale state issues
      set((state) => ({ messages: [...state.messages, res.data] }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // Real-time message listener
  subscribeToMessages: () => {
    // clear any previous subscription first (safe-guard)
    try {
      if (typeof unsubscribeLocal === "function") {
        unsubscribeLocal();
        unsubscribeLocal = null;
      }
    } catch (err) {
      // ignore
      // (we still proceed to create a new subscription)
    }

    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Handler captures the current selectedUser by value from get()
    const handleNewMessage = (newMessage) => {
      // Re-check selectedUser at runtime to avoid stale closures
      const currentSelected = get().selectedUser;
      if (!currentSelected) return;
      // Only add messages from the currently selected user (or messages to/from auth user)
      if (newMessage.senderId !== currentSelected._id && newMessage.receiverId !== currentSelected._id) {
        return;
      }

      // Append message safely
      set((state) => {
        // avoid adding duplicate message if same id already exists
        const exists = state.messages.some((m) => m._id === newMessage._id);
        if (exists) return state;
        return { messages: [...state.messages, newMessage] };
      });
    };

    // Register listener
    socket.on("newMessage", handleNewMessage);

    // Store unsubscribe in local variable (not zustand state)
    unsubscribeLocal = () => {
      try {
        socket.off("newMessage", handleNewMessage);
      } catch (err) {
        // ignore
      }
    };
  },

  // Stop listening
  unsubscribeFromMessages: () => {
    try {
      if (typeof unsubscribeLocal === "function") {
        unsubscribeLocal();
        unsubscribeLocal = null;
      }
    } catch (err) {
      // ignore errors during cleanup
      unsubscribeLocal = null;
    }
  },

  // Set selected user
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));