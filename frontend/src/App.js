import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import CreateRoomPage from "./pages/CreateRoomPage";
import JoinPage from "./pages/JoinPage";
import VotePage from "./pages/VotePage";
import ResultPage from "./pages/ResultPage";

function App() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);

  return (
    <Routes>
      {/* Home Page */}
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <img src="/logo.png" alt="We Vote Logo" className="w-48 mb-6" />
            <p className="text-gray-600 mb-8 text-center">
              Create a room, invite your friends, and start voting together!
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => (window.location.href = "/create")}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  const roomId = prompt("Enter Room ID:");
                  if (roomId) {
                    window.location.href = `/room/${roomId}`;
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
              >
                Join Room
              </button>
            </div>
          </div>
        }
      />

      {/* Create Room Page */}
      <Route
        path="/create"
        element={
          <CreateRoomPage
            setName={setName}
            setRoomId={setRoomId}
            setIsHost={setIsHost}
          />
        }
      />

      {/* Join Room Page */}
      <Route
        path="/room/:roomId"
        element={
          <JoinPage
            setName={setName}
            setRoomId={setRoomId}
            setIsHost={setIsHost}
          />
        }
      />

      {/* Vote Page */}
      <Route
        path="/room/:roomId/vote"
        element={<VotePage name={name} roomId={roomId} isHost={isHost} />}
      />

      {/* Result Page */}
      <Route
        path="/room/:roomId/result"
        element={<ResultPage name={name} roomId={roomId} isHost={isHost} />}
      />
    </Routes>
  );
}

export default App;
