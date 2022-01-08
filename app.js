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
const e = require("express");
if(process.argv.length < 3) {
  console.log("Error: expected a port as argument (eg. 'node app.js 3000').");
  process.exit(1);
}

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

  const playerType = currentGame.addPlayer(con);
  websockets[con["id"]] = currentGame;

  console.log(
    `Player ${con["id"]} placed in game ${currentGame.id} as ${playerType}`
  );

  currentGame.playerA.send(JSON.stringify(currentGame.getState(currentGame.playerA)))
  if(currentGame.playerB!=null)
  currentGame.playerB.send(JSON.stringify(currentGame.getState(currentGame.playerB)));

  if (currentGame.hasTwoConnectedPlayers()) {
    currentGame = new Game(gameStatus.gamesInitialized++);
  }

  con.on("message", function incoming(message) {
    const oMsg = JSON.parse(message.toString());

    const gameObj = websockets[con["id"]];
    let isValid = gameObj.isValidMove(con,oMsg)
    if(isValid != false)
    {
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
      gameObj.close('aborted');
    }
  });
});

server.listen(7071);