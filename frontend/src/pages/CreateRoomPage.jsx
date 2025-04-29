import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../api";

function CreateRoomPage({ setName, setRoomId, setIsHost }) {
  const [inputName, setInputName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!inputName.trim()) {
      alert("Please enter your name!");
      return;
    }

    try {
      const response = await createRoom(inputName);
      const roomId = response.data.roomId;
      console.log("Room created successfully:", roomId);

      setName(inputName); // User's name
      setRoomId(roomId); // Room ID
      setIsHost(true); // User is the host

      navigate(`/room/${roomId}/vote`);
    } catch (error) {
      console.error("Failed to create room", error);
      alert("Failed to create room, please try again later!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">Create New Room</h1>
        <input
          type="text"
          placeholder="Enter your name"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleCreateRoom}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}

export default CreateRoomPage;
