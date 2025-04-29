import axios from "axios";

const BASE_URL = "http://localhost:8000"; // 根據你後端的實際網址修改

// 建立房間（Create Room）
export const createRoom = (hostName) => {
  return axios.post(`${BASE_URL}/create-room`, { hostName });
};

// 加入房間（Join Room）
export const joinRoom = (roomId, name) => {
  return axios.post(`${BASE_URL}/join`, { roomId, name });
};

// 投票（Vote）
export const vote = (roomId, name, score) => {
  return axios.post(`${BASE_URL}/vote`, { roomId, name, score });
};

// 房主送出投票（Lock Votes）
export const lockVotes = (roomId, name) => {
  return axios.post(`${BASE_URL}/lock`, { roomId, name });
};

// 取得房間目前的投票結果（Results）
export const getResults = (roomId) => {
  return axios.get(`${BASE_URL}/results`, {
    params: { roomId },
  });
};

// 重新開始一輪（Restart）
export const restart = (roomId) => {
  return axios.post(`${BASE_URL}/restart`, { roomId });
};
