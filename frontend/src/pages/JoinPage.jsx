import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { joinRoom } from "../api";

function JoinPage({ setName, setRoomId, setIsHost }) {
  const [inputName, setInputName] = useState("");
  const navigate = useNavigate();
  const { roomId } = useParams(); // 從網址讀取 roomId

  const handleJoin = async () => {
    if (!inputName.trim()) {
      alert("請輸入名字！");
      return;
    }

    try {
      const response = await joinRoom(roomId, inputName);
      console.log(response.data);

      setName(inputName); // 記住自己的名字
      setRoomId(roomId); // 記住房號
      setIsHost(false); // 加入別人房間不是房主

      navigate(`/room/${roomId}/vote`);
    } catch (error) {
      console.error("加入失敗", error);
      alert("加入失敗，請確認房號正確或名字已存在！");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">加入房間</h1>
        <input
          type="text"
          placeholder="請輸入名字"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleJoin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          加入
        </button>
      </div>
    </div>
  );
}

export default JoinPage;
