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
  const isManualClose = useRef(false);

  const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const connectWebSocket = () => {
    if (
      socketRef.current &&
      socketRef.current.readyState !== WebSocket.CLOSED
    ) {
      console.log("WebSocket is already connected or connecting.");
      return;
    }

    const wsUrl = `wss://voting-app-lrrg.onrender.com/ws/${realRoomId}`;

    console.log("Attempting to establish WebSocket connection:", realRoomId);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established!");
      refreshResults();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.action === "refresh") {
          console.log("Received 'refresh', updating results!");
          refreshResults();
        } else if (message.action === "goto_result") {
          console.log("Received 'goto_result', navigating to result page!");
          navigate(`/room/${realRoomId}/result`);
        } else if (message.action === "goto_vote") {
          console.log("Received 'goto_vote', navigating back to vote page!");
          navigate(`/room/${realRoomId}/vote`);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    ws.onclose = () => {
      console.warn("WebSocket closed");
      if (!isManualClose.current) {
        console.log("⚠️ Unexpected disconnect. Retrying...");
        reconnectTimer.current = setTimeout(connectWebSocket, 1000);
      } else {
        console.log("✅ Manual close, no retry.");
      }
    };
  };

  useEffect(() => {
    isManualClose.current = false;
    connectWebSocket();

    return () => {
      console.log("Cleaning up WebSocket connection");
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

  const refreshResults = async () => {
    try {
      const response = await getResults(realRoomId);
      setPlayers(response.data.results);
      setLocked(response.data.locked);
      setAverage(response.data.average);
    } catch (error) {
      console.error("Failed to refresh results", error);
    }
  };

  const handleVote = async (score) => {
    if (selectedScore === score) {
      setSelectedScore(null);
      try {
        await vote(realRoomId, name, null);
        console.log("Vote cleared");
      } catch (error) {
        console.error("Failed to clear vote", error);
      }
    } else {
      setSelectedScore(score);
      try {
        await vote(realRoomId, name, score);
        console.log(`Voted: ${score}`);
      } catch (error) {
        console.error("Vote failed", error);
      }
    }
  };

  const handleLock = async () => {
    try {
      await lockVotes(realRoomId, name);
      console.log("Votes locked");
      navigate(`/room/${realRoomId}/result`);
    } catch (error) {
      console.error("Failed to lock votes", error);
      alert("Failed to lock votes, please try again!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Toast for successful link copy */}
      {copied && (
        <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce">
          ✅ Link copied!
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        {/* Copy invite link button */}
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
                .catch((err) => console.error("Failed to copy", err));
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
          >
            🔗 Copy Invite Link
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">
          Select Your Score
        </h1>

        {/* Voting buttons */}
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

        {/* Player list */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current Players:</h2>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.name}
                className="flex justify-between border-b pb-1"
              >
                <span>{player.name}</span>
                <span className="font-bold">
                  {!locked && player.score !== null ? "✅" : "👀"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Average score */}
        {locked && (
          <div className="mt-6 text-center">
            <h2 className="text-lg font-bold mb-2">Average Score</h2>
            <div className="text-3xl text-blue-500 font-extrabold">
              {average !== null ? average.toFixed(2) : "Not calculated yet"}
            </div>
          </div>
        )}

        {/* Host submit button */}
        {isHost && !locked && (
          <button
            onClick={handleLock}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all mt-6"
          >
            Submit Votes (Host Only)
          </button>
        )}
      </div>
    </div>
  );
}

export default VotePage;
