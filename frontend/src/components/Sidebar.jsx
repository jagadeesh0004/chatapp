import React from "react";
import useChatStore from "../store/useChatStore";

const Sidebar = ({ users }) => {
  const { selectedUser, setSelectedUser } = useChatStore();

  const handleUserClick = (user) => {
    if (selectedUser?._id === user._id) return; // prevent reselect loop
    setSelectedUser(user);
  };

  return (
    <div className="sidebar">
      <h2>Chats</h2>
      <ul>
        {users.map((user) => (
          <li
            key={user._id}
            onClick={() => handleUserClick(user)}
            className={selectedUser?._id === user._id ? "active" : ""}
          >
            {user.fullName}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;