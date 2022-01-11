const express = require("express");
const http = require("http");
const websocket = require("ws");
const gameStatus = require("./statTracker");
const Game = require("./game");

const port = process.argv[2];
const app = express();

app.use(express.static(__dirname + "/public"));
http.createServer(app).listen(port);

const indexRouter = require("./routes/index");

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.get("/play", indexRouter);
app.get("/", indexRouter);

const server = http.createServer(app);

const wss = new websocket.Server({ server });

let currentGame = new Game(gameStatus.gamesInitialized++);
let connectionID = 0;
const websockets = {};

wss.on("connection", function connection(ws) {
  const con = ws;
  con["id"] = connectionID++;

  const pType = currentGame.addPlayer(con);
  websockets[con["id"]] = currentGame;

  console.log(
    `Player ${con["id"]} placed in game ${currentGame.id} as ${pType}`
  );

  currentGame.playerWhite.send(JSON.stringify(currentGame.getState(currentGame.playerWhite)))
  if(currentGame.playerBlack!=null)
  currentGame.playerBlack.send(JSON.stringify(currentGame.getState(currentGame.playerBlack)));

  if (currentGame.hasTwoConnectedPlayers()) {
    currentGame = new Game(gameStatus.gamesInitialized++);
  }

  con.on("message", function incoming(message) {
    const oMsg = JSON.parse(message.toString());

    const gameObj = websockets[con["id"]];
    let isValid = gameObj.isValidMove(con,oMsg)
    if(isValid != false)
    {
      console.log(`User(id: ${con['id']}) performing move in game(id: ${gameObj.id}) moving: x: ${oMsg.fx} y: ${oMsg.fy} to x: ${oMsg.tx} y: ${oMsg.ty}.`)
      gameObj.performMove(con, oMsg, isValid);
    }
    else
    {
      con.send("Nu");
    }
  });

  con.on("close", function(code) {
    console.log(`${con["id"]} disconnected ...`);

    if (code == 1001) {
      const gameObj = websockets[con["id"]];
      gameStatus.gamesAborted++;
      gameObj.close(`$Game(id: {gameObj.id}) aborted.`);
    }
  });
});

server.listen(7071);