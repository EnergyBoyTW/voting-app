import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { joinRoom } from "../api";

function JoinPage({ setName, setRoomId, setIsHost }) {
  const [inputName, setInputName] = useState("");
  const navigate = useNavigate();
  const { roomId } = useParams(); // Read roomId from URL

  const handleJoin = async () => {
    if (!inputName.trim()) {
      alert("Please enter your name!");
      return;
    }

    try {
      const response = await joinRoom(roomId, inputName);
      console.log(response.data);

      setName(inputName); // Remember user's name
      setRoomId(roomId); // Remember room ID
      setIsHost(false); // Joining someone else's room, not host

      navigate(`/room/${roomId}/vote`);
    } catch (error) {
      console.error("Failed to join", error);
      alert(
        "Failed to join. Please check if the room ID is correct or if the name already exists!"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">Join Room</h1>
        <input
          type="text"
          placeholder="Enter your name"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleJoin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          Join
        </button>
      </div>
    </div>
  );
}

export default JoinPage;
