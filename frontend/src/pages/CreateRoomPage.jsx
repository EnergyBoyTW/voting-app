import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../api";

function CreateRoomPage({ setName, setRoomId, setIsHost }) {
  const [inputName, setInputName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!inputName.trim()) {
      alert("請輸入名字！");
      return;
    }

    try {
      const response = await createRoom(inputName);
      const roomId = response.data.roomId;
      console.log("房間建立成功:", roomId);

      setName(inputName); // 自己名字
      setRoomId(roomId); // 房號
      setIsHost(true); // 自己是房主

      navigate(`/room/${roomId}/vote`);
    } catch (error) {
      console.error("建立房間失敗", error);
      alert("建立房間失敗，請稍後再試！");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">建立新房間</h1>
        <input
          type="text"
          placeholder="請輸入你的名字"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleCreateRoom}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          建立房間
        </button>
      </div>
    </div>
  );
}

export default CreateRoomPage;
