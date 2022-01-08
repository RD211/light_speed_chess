function createImage(src)
{
  let a = new Image();
  a.src = src;
  return a;
};

let pieceToImage = [    
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
            else if((chessBoard[i][j]==share.wRege && isChess=='w') || (chessBoard[i][j]==share.bRege && isChess == 'b')){
              ctx.fillStyle = "#F08080";
              ctx.globalAlpha = 0.8;
            }
            else if(lastMove != null &&((i == lastMove.fy && j == lastMove.fx) ||(i == lastMove.ty && j == lastMove.tx))){
              ctx.fillStyle = "#FED8B1";
              ctx.globalAlpha = 0.8;
            }
            

            ctx.fillRect(j*75, i*75, (j+1)*75, (i+1)*75);  
            ctx.globalAlpha = 1.0;
            if(chessBoard[i][j]!=share.empty)
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
let allMoves = [];
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
            document.getElementById("info_you").innerHTML = Math.ceil((5-(Date.now()-last_turn_time)/1000)).toString();
            document.getElementById("info_him").innerHTML = "";
        }
        else
        {
            document.getElementById("info_him").innerHTML = Math.ceil((5-(Date.now()-last_turn_time)/1000)).toString();
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
    allMoves = data['moves'];
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
    let x = Math.floor(canvasX/75);
    let y = Math.floor(canvasY/75);
    if(onSelection)
    {
        onSelection = false;
        socket.send(JSON.stringify({
            'fx':from['x'],
            'fy':from['y'],
            'tx':x,
            'ty':y
        }));
        possibleMoves = [];
    }
    else if((share.colorOfPiece(chessBoard[y][x]) == 'w' && amIWhite) ||
    (share.colorOfPiece(chessBoard[y][x]) == 'b' && !amIWhite))
    {
        possibleMoves = [];
        onSelection = true;
        from = {'x':x,'y':y};
        for(let i = 0;i<8;i++)
        {
            for(let j = 0;j<8;j++)
            {

                if(share.validMoveChecker[chessBoard[y][x]](share.flipTable(chessBoard), 7-x, 7-y, 7-j, 7-i, allMoves)!=false)
                {
                    let tempBoard = JSON.parse(JSON.stringify(chessBoard));
                    tempBoard[i][j] = tempBoard[y][x];
                    tempBoard[y][x] = share.empty;
                    if(share.isSah(tempBoard) != share.colorOfPiece(chessBoard[y][x]))
                        possibleMoves.push({x:j,y:i});
                }
            }
        }
        console.log(possibleMoves);
        drawTable(chessBoard, isChess, possibleMoves, lastMove);
    }
}, false);