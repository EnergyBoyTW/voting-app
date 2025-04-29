import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResults, restart } from "../api";

function ResultPage({ name, roomId, isHost }) {
  const [results, setResults] = useState([]);
  const [average, setAverage] = useState(null);
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams(); // 從 URL 讀取房號

  const realRoomId = roomId || urlRoomId;
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connectWebSocket = () => {
    console.log("建立ResultPage WebSocket連線：", realRoomId);
    const ws = new WebSocket(`ws://localhost:8000/ws/${realRoomId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("ResultPage WebSocket連線成功！");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.action === "goto_vote") {
          console.log("收到 goto_vote，跳回投票頁！");
          navigate(`/room/${realRoomId}/vote`);
        }
      } catch (error) {
        console.error("WebSocket 訊息解析失敗", error);
      }
    };

    ws.onerror = (error) => {
      console.error("ResultPage WebSocket錯誤", error);
    };

    ws.onclose = () => {
      console.warn("ResultPage WebSocket 連線關閉，1秒後重試...");
      reconnectTimer.current = setTimeout(() => {
        connectWebSocket(); // 1秒後重連
      }, 1000);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      console.log("清理ResultPage WebSocket連線");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [realRoomId, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await getResults(realRoomId);
        setResults(response.data.results);
        setAverage(response.data.average);
      } catch (error) {
        console.error("取得結果失敗", error);
      }
    };

    fetchResults();
  }, [realRoomId]);

  const handleRestart = async () => {
    try {
      await restart(realRoomId);
      console.log("重新開始成功");
      // ❗ 這裡不需要自己 navigate，因為 server會broadcast "goto_vote" ，前端自動跳
    } catch (error) {
      console.error("重新開始失敗", error);
      alert("重新開始失敗！");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">投票結果</h1>

        {/* 玩家分數列表 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">玩家分數：</h2>
          <ul className="space-y-2">
            {results.map((player) => (
              <li
                key={player.name}
                className="flex justify-between border-b pb-1"
              >
                <span>{player.name}</span>
                <span className="font-bold">
                  {player.score !== null ? player.score : "未投票"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 平均分數 */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">平均分數：</h2>
          <div className="text-3xl text-blue-500 font-extrabold mt-2">
            {average !== null ? average.toFixed(2) : "尚未計算"}
          </div>
        </div>

        {/* 房主才能看到重新開始按鈕 */}
        {isHost && (
          <button
            onClick={handleRestart}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
          >
            重新開始新一輪
          </button>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
