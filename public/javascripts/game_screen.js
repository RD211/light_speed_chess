//#region Constants
const wPieton = 0;
const wCal = 1;
const wTurn = 2;
const wRege = 3;
const wRegina = 4;
const wNebun = 5;
const bPieton = 6;
const bCal = 7;
const bTurn = 8;
const bRege = 9;
const bRegina = 10;
const bNebun = 11;
const empty = 12;


function createImage(src)
{
  let a = new Image();
  a.src = src;
  return a;
};
export let pieceToImage = [    
    createImage("../images/w/pieton.png"),
    createImage("../images/w/cal.png"),
    createImage("../images/w/turn.png"),
    createImage("../images/w/rege.png"),
    createImage("../images/w/regina.png"),
    createImage("../images/w/nebun.png"),
    createImage("../images/b/pieton.png"),
    createImage("../images/b/cal.png"),
    createImage("../images/b/turn.png"),
    createImage("../images/b/rege.png"),
    createImage("../images/b/regina.png"),
    createImage("../images/b/nebun.png"),
    createImage("../images/empty.png"),
]

function colorOfPiece(piece)
{
  return piece<=5?'w':(piece == empty)?null:'b';
}
//#endregion

// We consider every move as being from a black object(top of board)
let checkPawn = function(board, fx, fy, tx, ty){
  if(fy>=ty) return false;
  let dest = board[ty][tx];
  let colorFrom = colorOfPiece(board[fy][fx]);
  let colorTo = colorOfPiece(board[ty][tx]);
  if(board[fy][fx]==empty)  return false;
  if(colorTo == colorFrom) return false;

  if(fx==tx)
  {
    if(ty-fy==1 && dest == empty)
      return true;
    if(ty-fy==2 && fy==1 && dest == empty && board[fy+1][tx] == empty)
      return true;
  }
  else if(Math.abs(fx-tx)==1)
  {
    if(ty-fy==1 && dest != empty)
      return true;
  }
  return false;
};


let checkCal = function(board, fx, fy, tx, ty){
  let colorFrom = colorOfPiece(board[fy][fx]);
  let colorTo = colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == empty)  return false;
  if(colorTo == colorFrom) return false;
  let dx = Math.abs(fx-tx);
  let dy = Math.abs(fy-ty);
  return JSON.stringify([dx,dy].sort()) == JSON.stringify([1,2]);
};

let checkNebun = function(board, fx, fy, tx, ty){
  let colorFrom = colorOfPiece(board[fy][fx]);
  let colorTo = colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == empty)  return false;
  if(colorTo == colorFrom) return false;
  if(Math.abs(fx-tx)!=Math.abs(ty-fy)) return false;
  let addX = tx>fx?1:-1;
  let addY = ty>fy?1:-1;
  for(let i = 1; fx+i*addX != tx;i++)
  {
    if(board[fy+i*addY][fx+i*addX] != empty)
      return false;
  }
  return true;
};

let checkTura = function(board, fx, fy, tx, ty){
  let colorFrom = colorOfPiece(board[fy][fx]);
  let colorTo = colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == empty)  return false;
  if(colorTo == colorFrom) return false;
  if(Math.abs(fx-tx)!=0 &&
     Math.abs(ty-fy) != 0) return false;
  let addX = tx>fx?1:tx<fx?-1:0;
  let addY = ty>fy?1:ty<fy?-1:0;
  for(let i = 1; fx+i*addX != tx || fy+i*addY != ty;i++)
  {
    if(board[fy+i*addY][fx+i*addX] != empty)
      return false;
  }
  return true;
};
let checkRegina = function(board, fx, fy, tx, ty) {
  return checkNebun(board,fx,fy,tx,ty) || checkTura(board,fx,fy,tx,ty);
};

let checkKing = function(board, fx,fy,tx,ty) {
  let colorFrom = colorOfPiece(board[fy][fx]);
  let colorTo = colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == empty)  return false;
  if(colorTo == colorFrom) return false;
  return Math.abs(fx-tx) <= 1 && Math.abs(fy-ty) <= 1;
};
let validMoveChecker = {
  0: checkPawn,
  1: checkCal,
  2: checkTura,
  3: checkKing,
  4:checkRegina,
  5: checkNebun,
  6: checkPawn,
  7: checkCal,
  8: checkTura,
  9: checkKing,
  10:checkRegina,
  11: checkNebun,
  12: ()=>false,
};
function isSah(board) {

    let whiteKingPos = null;
    let blackKingPos = null;
  
    for(let y = 0;y<8;y++)
    {
      for(let x = 0;x<8;x++)
      {
        if(board[y][x]==wRege)
          whiteKingPos = {x:x, y:y};
        if(board[y][x]==bRege)
          blackKingPos = {x:x, y:y};
      }
    }
    for(let y = 0;y<8;y++)
    {
      for(let x = 0;x<8;x++)
      {
        let piece = board[y][x];
        if(piece!=empty){
          if(colorOfPiece(piece)=='w')
          {
            if(validMoveChecker[board[y][x]](flipTable(board),7-x,7-y,7-blackKingPos.x, 7-blackKingPos.y))
            {
              return 'b';
            }
          }
          else
          {
            if(validMoveChecker[board[y][x]](board,x,y,whiteKingPos.x, whiteKingPos.y))
            {
              return 'w';
            }
          }
        }
      }
    }
    return null;
  }
  
  
function flipTable(chessBoard){
    let newBoard = JSON.parse(JSON.stringify(chessBoard));
    return newBoard.map(row=>row.reverse()).reverse();
  }

let canvas = document.getElementById("chess_game");

function drawTable(chessBoard, isChess, possibleMoves, lastMove)
{
    let canvas = document.getElementById("chess_game");
    let ctx = canvas.getContext("2d");
    for(let i = 0;i<8;i++)
    {
        for(let j=0;j<8;j++)
        {
            ctx.fillStyle = (i+j)%2==0?"#000fda":"#009fda";
            ctx.fillRect(j*75, i*75, (j+1)*75, (i+1)*75);

            if(possibleMoves.some((move)=>{
              return move.x==j&&move.y==i;
            })){
              ctx.fillStyle = "#66FF00";
              ctx.globalAlpha = 0.8;
            }
            else if((chessBoard[i][j]==wRege && isChess=='w') || (chessBoard[i][j]==bRege && isChess == 'b')){
              ctx.fillStyle = "#F08080";
              ctx.globalAlpha = 0.8;
            }
            else if(lastMove != null &&((i == lastMove.fy && j == lastMove.fx) ||(i == lastMove.ty && j == lastMove.tx))){
              ctx.fillStyle = "#FED8B1";
              ctx.globalAlpha = 0.8;
            }
            

            ctx.fillRect(j*75, i*75, (j+1)*75, (i+1)*75);  
            ctx.globalAlpha = 1.0;
            if(chessBoard[i][j]!=empty)
            ctx.drawImage(pieceToImage[chessBoard[i][j]], j*75, i*75+10);
        }
    }
}

const socket = new WebSocket("ws://localhost:7071");

let last_turn_time = Date.now();
let myTurn = false;
let started = false;
let seconds = 0;
let isChess = null;
let chessBoard = [];
let isCheckMate = false;
let gameAborted = false;
let lastMove = null;
let moveCount = 0;
let amIWhite = false;
setInterval(()=>{
    if(isCheckMate)
    {
        if(myTurn)
            document.getElementById("info_him").innerHTML = `<h1>Game lost.</h1><form action="/play" method="get">
            <button type="submit" class = "play_button">
                <h2>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspPlay&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</h2>
            </button>
        </form>`
        else
            document.getElementById("info_him").innerHTML = `<h1>Game won. Nice.</h1><form action="/play" method="get">
            <button type="submit" class = "play_button">
                <h2>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspPlay&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</h2>
            </button>
        </form>`
    }
    else if(gameAborted){
        document.getElementById("info_him").innerHTML = `<h1>Game aborted.</h1><form action="/play" method="get">
        <button type="submit" class = "play_button">
            <h2>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspPlay&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</h2>
        </button>
    </form>`
    }
    
    else if(!started)
    {
        document.getElementById("info_him").innerHTML = "<h1>Waiting for another player</h1>"
        document.getElementById("info_you").innerHTML = ""
    }
    else
    {
        if(myTurn)
        {
            new Audio("../sounds/tock.wav").play();

            //Aici trebuia sa fie seconds in loc de 0 dar din ceva motiv asta merge? nu inteleg
            document.getElementById("info_you").innerHTML = Math.ceil((0-(Date.now()-last_turn_time)/1000)).toString();
            document.getElementById("info_him").innerHTML = "";
        }
        else
        {
            document.getElementById("info_him").innerHTML = Math.ceil((0-(Date.now()-last_turn_time)/1000)).toString();
            document.getElementById("info_you").innerHTML = "";
        }
    }
},500);

let onSelection = false;
let from = null;
let possibleMoves = [];
socket.onmessage = function (event) {
    possibleMoves = [];
    let data = JSON.parse(event.data);
    last_turn_time = data['last_turn_time'];
    myTurn = data['yourTurn'];
    started = data['started'];
    seconds = data['seconds'];
    isChess = data['isSah'];
    chessBoard = data['board'];
    isCheckMate = data['isCheckMate'];
    lastMove = data['last_move'];
    if(isCheckMate && myTurn)
    {
      new Audio('../sounds/lose.wav').play();
    }
    else if(isCheckMate)
    {
      new Audio('../sounds/win.wav').play();
    }
    if(data['moveCount']!=moveCount)
    {
      new Audio('../sounds/move.wav').play();
      moveCount = data['moveCount'];
    }
    amIWhite = moveCount%2==0?myTurn:!myTurn;

    drawTable(chessBoard, isChess, possibleMoves, lastMove);
};

socket.onopen = function () {
};
socket.onclose = function () {
    gameAborted = true;
    console.log("aborteeeeeddd");
};


canvas.addEventListener("click", (e)=>{
    if(!myTurn) return;
    let totalOffsetX = 0;
    let totalOffsetY = 0;
    let canvasX = 0;
    let canvasY = 0;
    let currentElement = canvas;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = e.pageX - totalOffsetX+300;
    canvasY = e.pageY - totalOffsetY +300;
    console.log(canvasX+" "+canvasY );
    let x = Math.floor(canvasX/75);
    let y = Math.floor(canvasY/75);
    if(onSelection)
    {
        onSelection = false;
        console.log("sending");
        socket.send(JSON.stringify({
            'fx':from['x'],
            'fy':from['y'],
            'tx':x,
            'ty':y
        }));
        possibleMoves = [];
    }
    else if((colorOfPiece(chessBoard[y][x]) == 'w' && amIWhite) ||
    (colorOfPiece(chessBoard[y][x]) == 'b' && !amIWhite))
    {
        possibleMoves = [];
        onSelection = true;
        from = {'x':x,'y':y};
        for(let i = 0;i<8;i++)
        {
            for(let j = 0;j<8;j++)
            {

                if(validMoveChecker[chessBoard[y][x]](flipTable(chessBoard), 7-x, 7-y, 7-j, 7-i))
                {
                    console.log("considering " +j+" "+i);
                    let tempBoard = JSON.parse(JSON.stringify(chessBoard));
                    tempBoard[i][j] = tempBoard[y][x];
                    tempBoard[y][x] = empty;
                    if(isSah(tempBoard) != colorOfPiece(chessBoard[y][x]))
                        possibleMoves.push({x:j,y:i});
                }
            }
        }
        console.log(possibleMoves);
        drawTable(chessBoard, isChess, possibleMoves, lastMove);
    }
}, false);