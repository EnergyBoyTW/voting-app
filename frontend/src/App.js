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
      {/* 首頁 */}
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-3xl font-bold mb-8">歡迎來到投票系統</h1>
            <div className="flex gap-4">
              <button
                onClick={() => (window.location.href = "/create")}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                建立房間
              </button>
              <button
                onClick={() => {
                  const roomId = prompt("請輸入房號:");
                  if (roomId) {
                    window.location.href = `/room/${roomId}`;
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                加入房間
              </button>
            </div>
          </div>
        }
      />

      {/* 建立房間頁 */}
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

      {/* 加入房間頁 */}
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

      {/* 投票頁 */}
      <Route
        path="/room/:roomId/vote"
        element={<VotePage name={name} roomId={roomId} isHost={isHost} />}
      />

      {/* 結果頁 */}
      <Route
        path="/room/:roomId/result"
        element={<ResultPage name={name} roomId={roomId} isHost={isHost} />}
      />
    </Routes>
  );
}

export default App;
