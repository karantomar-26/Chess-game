const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();
module.exports = { chess };

let player = {};
let currentPlayer = "w";

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
// app.set("views", ". /views");

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (socket) => {
  console.log("connected");

  if (!player.white) {
    player.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!player.black) {
    player.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  socket.on("disconnect", function () {
    console.log("User disconnected");
    if (player.white === socket.id) {
      delete player.white;
    } else if (player.black === socket.id) {
      delete player.black;
    } else {
      console.log("User is a spectator");
    }
  });

  socket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && socket.id !== player.white) return;
      if (chess.turn() === "b" && socket.id !== player.black) return;

      const result = chess.move(move);

      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardstate", chess.fen());
      } else {
        console.log("Invalid move:", move);
        socket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
      socket.emit("Invalid move : ", move);
    }
  });
});

server.listen(8000, function () {
  console.log("Server is running on port 8000");
});
