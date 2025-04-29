from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import uuid
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

connected_rooms = {}  # room_id -> List[WebSocket]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Rooms 結構: roomId -> { "players": {...}, "locked": False, "host": "房主名字" }
rooms = {}

# --- Data Models ---

class CreateRoomRequest(BaseModel):
    hostName: str

class JoinRequest(BaseModel):
    roomId: str
    name: str

class VoteRequest(BaseModel):
    roomId: str
    name: str
    score: int

class LockRequest(BaseModel):
    roomId: str
    name: str

class RestartRequest(BaseModel):
    roomId: str

# --- APIs ---

@app.post("/create-room")
def create_room(request: CreateRoomRequest):
    host_name = request.hostName
    room_id = str(uuid.uuid4())[:6].upper()
    rooms[room_id] = {
        "players": {
            host_name: {"score": None}
        },
        "locked": False,
        "host": host_name
    }
    return {"roomId": room_id}

@app.post("/join")
async def join_room(request: JoinRequest):
    room_id = request.roomId
    name = request.name

    if room_id not in rooms:
        return {"message": "房間不存在！"}

    if name in rooms[room_id]["players"]:
        return {"message": f"{name} 已經加入過了！"}

    rooms[room_id]["players"][name] = {"score": None}

    await broadcast_update(room_id)

    return {"message": f"歡迎 {name} 加入房間 {room_id}！"}

@app.post("/vote")
async def vote_player(request: VoteRequest):
    room_id = request.roomId
    name = request.name
    score = request.score

    if room_id not in rooms:
        return {"message": "房間不存在！"}

    if name not in rooms[room_id]["players"]:
        return {"message": "玩家不存在！"}

    rooms[room_id]["players"][name]["score"] = score

    # ✅ 這行！投票完就廣播 refresh
    await broadcast_update(room_id)

    return {"message": f"{name} 投了 {score} 分"}

@app.post("/lock")
async def lock_votes(request: LockRequest):
    room_id = request.roomId
    name = request.name

    if room_id not in rooms:
        return {"message": "房間不存在！"}

    if name != rooms[room_id]["host"]:
        return {"message": "只有房主可以鎖定投票！"}

    rooms[room_id]["locked"] = True

    await broadcast_update(room_id, action="goto_result")

    return {"message": f"房間 {room_id} 投票已鎖定"}

@app.get("/results")
def get_results(roomId: Optional[str] = None):
    if roomId is None or roomId not in rooms:
        return {"message": "房間不存在！"}

    room = rooms[roomId]
    results_list = [{"name": name, "score": info["score"]} for name, info in room["players"].items()]
    scores = [info["score"] for info in room["players"].values() if info["score"] is not None]

    average_score = round(sum(scores) / len(scores), 2) if scores else None

    return {
        "locked": room["locked"],
        "results": results_list,
        "average": average_score
    }

@app.post("/restart")
async def restart_game(request: RestartRequest):
    room_id = request.roomId

    if room_id not in rooms:
        return {"message": "房間不存在！"}

    for player in rooms[room_id]["players"]:
        rooms[room_id]["players"][player]["score"] = None

    rooms[room_id]["locked"] = False

    await broadcast_update(room_id, action="goto_vote") 

    return {"message": f"房間 {room_id} 已重置，玩家可以重新投票"}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    print(f"有人嘗試連到房間 {room_id}")
    await websocket.accept()
    if room_id not in connected_rooms:
        connected_rooms[room_id] = []
    connected_rooms[room_id].append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print(f"房間 {room_id} 有人斷線")
    except Exception as e:
        print(f"WebSocket 其他錯誤：{e}")

async def broadcast_update(room_id: str, action: str = "refresh"):
    if room_id in connected_rooms:
        websockets = connected_rooms[room_id].copy()  # 先複製一份，避免邊迭代邊改 list
        for ws in websockets:
            try:
                await ws.send_json({"action": action})
            except Exception as e:
                print(f"移除斷線WebSocket: {e}")
                connected_rooms[room_id].remove(ws)  # 出錯就從 connected_rooms 裡面刪掉
