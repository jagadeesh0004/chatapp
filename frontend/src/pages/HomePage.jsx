import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* --- SIDEBAR WRAPPER --- */}
            {/* This div hides on mobile when a user is selected */}
            <div
              className={`
                ${selectedUser ? 'hidden' : 'flex'} 
                h-full flex-col md:flex
              `}
            >
              <Sidebar />
            </div>

            {/* --- CHAT AREA WRAPPER --- */}
            {/* This div shows on mobile when a user is selected */}
            <div
              className={`
                ${selectedUser ? 'flex' : 'hidden'} 
                h-full w-full flex-col md:flex
              `}
            >
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;