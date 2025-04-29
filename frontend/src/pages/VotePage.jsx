import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vote, lockVotes, getResults } from "../api";

function VotePage({ name, roomId, isHost }) {
  const [selectedScore, setSelectedScore] = useState(null);
  const [players, setPlayers] = useState([]);
  const [locked, setLocked] = useState(false);
  const [average, setAverage] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const realRoomId = roomId || urlRoomId;
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);

  const scores = [1, 2, 3, 5, 8, 13];

  const connectWebSocket = () => {
    console.log("嘗試建立 WebSocket 連線:", realRoomId);
    const ws = new WebSocket(`ws://localhost:8000/ws/${realRoomId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket 連線成功！");
      refreshResults();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.action === "refresh") {
          console.log("收到 refresh，刷新結果！");
          refreshResults();
        } else if (message.action === "goto_result") {
          console.log("收到 goto_result，跳轉到結果頁！");
          navigate(`/room/${realRoomId}/result`);
        } else if (message.action === "goto_vote") {
          console.log("收到 goto_vote，跳回投票頁！");
          navigate(`/room/${realRoomId}/vote`);
        }
      } catch (error) {
        console.error("WebSocket 訊息解析失敗", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket錯誤", error);
    };

    ws.onclose = () => {
      console.warn("WebSocket 連線關閉，1秒後重試...");
      reconnectTimer.current = setTimeout(() => {
        connectWebSocket(); // 1秒後重連
      }, 1000);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      console.log("清理 WebSocket 連線");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, []);

  const refreshResults = async () => {
    try {
      const response = await getResults(realRoomId);
      setPlayers(response.data.results);
      setLocked(response.data.locked);
      setAverage(response.data.average);
    } catch (error) {
      console.error("刷新結果失敗", error);
    }
  };

  const handleVote = async (score) => {
    setSelectedScore(score);
    try {
      await vote(realRoomId, name, score);
      console.log(`已投票: ${score}`);
    } catch (error) {
      console.error("投票失敗", error);
    }
  };

  const handleLock = async () => {
    try {
      await lockVotes(realRoomId, name);
      console.log("投票已鎖定");
      navigate(`/room/${realRoomId}/result`);
    } catch (error) {
      console.error("鎖定失敗", error);
      alert("鎖定失敗，請重試！");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Toast 複製成功提示 */}
      {copied && (
        <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce">
          ✅ 連結已複製！
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        {/* 複製連結按鈕 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              const inviteUrl = `${window.location.origin}/room/${realRoomId}`;
              navigator.clipboard
                .writeText(inviteUrl)
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                })
                .catch((err) => console.error("複製失敗", err));
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
          >
            複製邀請連結
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">請選擇你的分數</h1>

        {/* 投票按鈕 */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {scores.map((score) => (
            <button
              key={score}
              onClick={() => handleVote(score)}
              className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                selectedScore === score
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-blue-500 border-blue-500 hover:bg-blue-100"
              } transition-all`}
            >
              {score}
            </button>
          ))}
        </div>

        {/* 玩家列表 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">目前玩家：</h2>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.name}
                className="flex justify-between border-b pb-1"
              >
                <span>{player.name}</span>
                <span className="font-bold">
                  {!locked && player.score !== null ? "✅ OK" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 平均分數 */}
        {locked && (
          <div className="mt-6 text-center">
            <h2 className="text-lg font-bold mb-2">平均分數</h2>
            <div className="text-3xl text-blue-500 font-extrabold">
              {average !== null ? average.toFixed(2) : "尚未計算"}
            </div>
          </div>
        )}

        {/* 房主送出按鈕 */}
        {isHost && !locked && (
          <button
            onClick={handleLock}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all mt-6"
          >
            送出投票（房主專用）
          </button>
        )}
      </div>
    </div>
  );
}

export default VotePage;
