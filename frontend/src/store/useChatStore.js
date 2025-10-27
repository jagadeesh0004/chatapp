import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

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

  // Fetch messages for selected user
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
      // append safely
      set((state) => ({ messages: [...state.messages, res.data] }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // ✅ Real-time message subscription
  subscribeToMessages: () => {
    try {
      if (typeof unsubscribeLocal === "function") {
        unsubscribeLocal();
        unsubscribeLocal = null;
      }
    } catch {
      unsubscribeLocal = null;
    }

    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket || !selectedUser?._id) return;

    const handleNewMessage = (newMessage) => {
      const currentSelected = get().selectedUser;
      if (!currentSelected) return;

      // Only messages related to this chat
      if (
        newMessage.senderId !== currentSelected._id &&
        newMessage.receiverId !== currentSelected._id
      ) {
        return;
      }

      set((state) => {
        const exists = state.messages.some((m) => m._id === newMessage._id);
        if (exists) return state;
        return { messages: [...state.messages, newMessage] };
      });
    };

    // ✅ Avoid stacking multiple listeners
    socket.off("newMessage", handleNewMessage);
    socket.on("newMessage", handleNewMessage);

    // store unsubscribe safely
    unsubscribeLocal = () => {
      try {
        socket.off("newMessage", handleNewMessage);
      } catch {
        // ignore
      }
    };
  },

  // Unsubscribe safely
  unsubscribeFromMessages: () => {
    try {
      if (typeof unsubscribeLocal === "function") {
        unsubscribeLocal();
        unsubscribeLocal = null;
      }
    } catch {
      unsubscribeLocal = null;
    }
  },

  // Select user
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));