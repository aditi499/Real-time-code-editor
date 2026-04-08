import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

/* ===== SOCKET SERVER URL ===== */
/* Connects to deployed Render backend */
const SERVER_URL = "https://real-time-code-editor-1-ra0p.onrender.com";

function App() {
const [socket, setSocket] = useState(null);
const [username, setUsername] = useState("");
const [room, setRoom] = useState("");
const [joined, setJoined] = useState(false);

const [code, setCode] = useState("");
const [users, setUsers] = useState([]);

const [language, setLanguage] = useState("javascript");
const [output, setOutput] = useState("");

const [message, setMessage] = useState("");
const [chat, setChat] = useState([]);

const [typingUser, setTypingUser] = useState("");
// eslint-disable-next-line no-unused-vars
const [toast] = useState("");


// SOCKET CONNECTION
useEffect(() => {
const newSocket = io(SERVER_URL);
setSocket(newSocket);
return () => newSocket.disconnect();
}, []);

// ROOM FROM URL
useEffect(() => {
const params = new URLSearchParams(window.location.search);
const roomFromURL = params.get("room");
if (roomFromURL) setRoom(roomFromURL);
}, []);

// SOCKET LISTENERS
useEffect(() => {
if (!socket) return;

socket.on("receive_message", (data) => setCode(data));
socket.on("room_users", (usersList) => setUsers(usersList));

socket.on("receive_chat", (data) => {
  setChat((prev) => [...prev, data]);
});

socket.on("show_typing", (user) => {
  if (user !== username) {
    setTypingUser(user);
    setTimeout(() => setTypingUser(""), 1500);
  }
});

socket.on("receive_output", (out) => setOutput(out));

socket.on("update_users", (usersList) => {
  setUsers(usersList);
});

return () => {
  socket.off("receive_message");
  socket.off("room_users");
  socket.off("receive_chat");
  socket.off("show_typing");
  socket.off("receive_output");
};

}, [socket, username]);

// JOIN ROOM
const joinRoom = () => {
if (socket && username.trim() && room.trim()) {
socket.emit("join_room", { room, username });
setJoined(true);
} else {
alert("Enter username and room");
}
};

// CODE CHANGE
const handleChange = (value) => {
if (!socket || value === undefined) return;

setCode(value);

socket.emit("send_message", {
  room,
  data: value,
});

};

// SEND CHAT
const sendMessage = () => {
if (message.trim() === "") return;

const msgData = {
  room,
  username,
  message,
  time: new Date().toLocaleTimeString(),
};

socket.emit("send_chat", msgData);
setMessage("");

};

// RUN CODE
const runCode = async () => {
try {
let endpoint = "";

  if (language === "javascript")
    endpoint = `${SERVER_URL}/run-js`;
  else if (language === "python")
    endpoint = `${SERVER_URL}/run-python`;
  else if (language === "cpp")
    endpoint = `${SERVER_URL}/run-cpp`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();

  setOutput(data.output);
} catch (err) {
  setOutput("Error running code");
}

};

// COPY ROOM LINK
const copyRoomLink = () => {
const link = window.location.href;

if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard
    .writeText(link)
    .then(() => {
      alert("Room link copied!");
    })
    .catch(() => {
      fallbackCopy(link);
    });
} else {
  fallbackCopy(link);
}

};

const fallbackCopy = (text) => {
const textArea = document.createElement("textarea");
textArea.value = text;

document.body.appendChild(textArea);
textArea.select();
document.execCommand("copy");

document.body.removeChild(textArea);

alert("Room link copied!");

};

// DOWNLOAD CODE
const downloadCode = () => {
let extension = "txt";

if (language === "javascript") extension = "js";
if (language === "python") extension = "py";
if (language === "cpp") extension = "cpp";

const element = document.createElement("a");

const file = new Blob([code], { type: "text/plain" });

element.href = URL.createObjectURL(file);
element.download = `code.${extension}`;

document.body.appendChild(element);
element.click();

};

const iconBtn = {
padding: "8px 10px",
background: "#3c3c3c",
color: "white",
border: "none",
borderRadius: "6px",
cursor: "pointer",
fontSize: "16px",
};

return (
<div style={{ height: "100vh", background: "#1e1e1e", color: "white" }}>
{!joined ? (
<div style={{ textAlign: "center", marginTop: "100px" }}> <h2>Join Code Room</h2>

      <input
        placeholder="Enter Username"
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
      />

      <br />

      <input
        placeholder="Enter Room ID"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
      />

      <br />

      <button
        onClick={joinRoom}
        style={{
          padding: "10px 20px",
          background: "#0e639c",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Join
      </button>
    </div>
  ) : (
    <div style={{ display: "flex", height: "100%" }}>
      <div
        style={{
          width: "20%",
          background: "#252526",
          padding: "15px",
          borderRight: "1px solid #333",
        }}
      >
        <h3>👥 Users</h3>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>

      <div style={{ width: "80%", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px",
            background: "#333",
            alignItems: "center",
          }}
        >
          <div>
            <strong>{username}</strong> | Room: {room}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>

            <button onClick={runCode} style={iconBtn}>▶</button>
            <button onClick={downloadCode} style={iconBtn}>⬇</button>
            <button onClick={copyRoomLink} style={iconBtn}>🔗</button>
          </div>
        </div>

        <Editor
          height="50%"
          language={language === "cpp" ? "cpp" : language}
          value={code}
          theme="vs-dark"
          onChange={handleChange}
        />

        <div style={{ height: "20%", padding: "10px" }}>
          <h4>Output</h4>
          <pre style={{ color: "#00ff00" }}>{output}</pre>
        </div>

        <div style={{ padding: "10px", background: "#252526", height: "30%" }}>
          <h4>💬 Chat</h4>

          {typingUser && (
            <div style={{ fontSize: "12px", color: "#aaa" }}>
              {typingUser} is typing...
            </div>
          )}

          <div
            style={{
              maxHeight: "120px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {chat.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf:
                    msg.username === username ? "flex-end" : "flex-start",
                  background:
                    msg.username === username ? "#0e639c" : "#333",
                  padding: "8px",
                  margin: "5px",
                  borderRadius: "10px",
                }}
              >
                <strong>{msg.username}</strong>
                <div>{msg.message}</div>
                <div style={{ fontSize: "10px" }}>{msg.time}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", marginTop: "10px" }}>
            <input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                socket.emit("typing", { room, username });
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type message..."
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "5px",
                border: "none",
              }}
            />

            <button
              onClick={sendMessage}
              style={{
                marginLeft: "10px",
                padding: "8px 12px",
                background: "#0e639c",
                color: "white",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {toast && (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#333",
        padding: "10px 15px",
        borderRadius: "8px",
      }}
    >
      {toast}
    </div>
  )}
</div>

);
}

export default App;
