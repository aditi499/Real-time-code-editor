import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";

const users = {};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

/* ================= SOCKET ================= */

io.on("connection", (socket) => {

  socket.on("join_room", ({ room, username }) => {

    socket.join(room);

    if (!users[room]) users[room] = [];

    users[room].push(username);

    io.to(room).emit("update_users", users[room]);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data.data);
  });

  socket.on("send_chat", (data) => {
    socket.to(data.room).emit("receive_chat", data);
  });

  socket.on("share_output", (data) => {
    socket.to(data.room).emit("receive_output", data.output);
  });

  socket.on("disconnect", () => {
    for (const room in users) {
      users[room] = users[room].filter((u) => u !== socket.username);
      io.to(room).emit("update_users", users[room]);
    }
  });

});

/* ================= RUN JAVASCRIPT ================= */

app.post("/run-js", (req, res) => {

  const { code } = req.body;

  fs.writeFileSync("temp.js", code);

  exec("node temp.js", (error, stdout, stderr) => {

    if (error) return res.json({ output: stderr });

    res.json({ output: stdout });

  });

});

/* ================= RUN PYTHON ================= */

app.post("/run-python", (req, res) => {

  const { code } = req.body;

  fs.writeFileSync("temp.py", code);

  exec("python temp.py", (error, stdout, stderr) => {

    if (error) return res.json({ output: stderr });

    res.json({ output: stdout });

  });

});

/* ================= RUN C++ ================= */

app.post("/run-cpp", (req, res) => {

  const { code } = req.body;

  fs.writeFileSync("temp.cpp", code);

  exec("g++ temp.cpp -o temp.exe && temp.exe", (error, stdout, stderr) => {

    if (error) return res.json({ output: stderr });

    res.json({ output: stdout });

  });

});

/* ================= START SERVER ================= */

/* Important for Render deployment */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});