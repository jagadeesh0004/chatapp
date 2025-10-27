import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

const Sidebar = () => {
  const {
    users,
    getUsers,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
  } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getUsers(); // Fetch user list on load
  }, [getUsers]);

  const handleUserClick = (user) => {
    if (selectedUser?._id === user._id) return; // avoid reselect loop
    setSelectedUser(user);
  };

  if (isUsersLoading) {
    return (
      <div className="p-4 text-center text-sm opacity-70">Loading users...</div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-4 text-center text-sm opacity-70">
        No users found
      </div>
    );
  }

  return (
    <div className="w-64 bg-base-300 border-r border-base-200 flex flex-col">
      <h2 className="text-lg font-semibold p-4 border-b border-base-200">
        Chats
      </h2>
      <ul className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <li
            key={user._id}
            onClick={() => handleUserClick(user)}
            className={`p-3 cursor-pointer hover:bg-base-200 ${
              selectedUser?._id === user._id ? "bg-base-200 font-semibold" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="w-8 h-8 rounded-full border border-base-100"
              />
              <span>{user.fullName}</span>
              {user._id === authUser?._id && (
                <span className="text-xs opacity-60">(You)</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;