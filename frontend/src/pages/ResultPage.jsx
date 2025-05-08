import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResults, restart } from "../api";

function ResultPage({ name, roomId, isHost }) {
  const [results, setResults] = useState([]);
  const [average, setAverage] = useState(null);
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams(); // Get room ID from URL

  const realRoomId = roomId || urlRoomId;
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const isManualClose = useRef(false);

  const connectWebSocket = () => {
    const wsUrl = `wss://voting-app-lrrg.onrender.com/ws/${realRoomId}`;
    console.log("Establishing ResultPage WebSocket connection:", realRoomId);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("ResultPage WebSocket connected!");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.action === "goto_vote") {
          console.log("Received 'goto_vote', navigating back to VotePage!");
          navigate(`/room/${realRoomId}/vote`);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message", error);
      }
    };

    ws.onerror = (error) => {
      console.error("ResultPage WebSocket error", error);
    };

    ws.onclose = () => {
      console.warn("ResultPage WebSocket closed");
      if (!isManualClose.current) {
        console.log("⚠️ Unexpected disconnect. Retrying...");
        reconnectTimer.current = setTimeout(() => {
          connectWebSocket();
        }, 1000);
      } else {
        console.log("✅ Manual close, not retrying");
      }
    };
  };
  const fetchResults = async () => {
    try {
      const response = await getResults(realRoomId);
      setResults(response.data.results);
      setAverage(response.data.average);
    } catch (error) {
      console.error("Failed to fetch results", error);
    }
  };

  useEffect(() => {
    connectWebSocket();
    fetchResults();

    return () => {
      console.log("Cleaning up ResultPage WebSocket connection");
      isManualClose.current = true;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, []);

  const handleRestart = async () => {
    try {
      await restart(realRoomId);
      console.log("Restart successful");
      // ❗ No need to manually navigate; server will broadcast "goto_vote"
    } catch (error) {
      console.error("Failed to restart", error);
      alert("Failed to restart!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Voting Results</h1>

        {/* Player scores list */}
        <div className="mb-6">
          <ul className="space-y-2">
            {results.map((player) => (
              <li
                key={player.name}
                className="flex justify-between border-b pb-1"
              >
                <span>{player.name}</span>
                <span className="font-bold">
                  {player.score !== null ? player.score : "No vote"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Average score */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">Average Score:</h2>
          <div className="text-3xl text-blue-500 font-extrabold mt-2">
            {average !== null ? average.toFixed(2) : "Not calculated yet"}
          </div>
        </div>

        {/* Host-only restart button */}
        {isHost && (
          <button
            onClick={handleRestart}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
          >
            Restart New Round
          </button>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
