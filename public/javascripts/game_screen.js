function drawTable(chessBoard, isChess, possibleMoves, lastMove)
{

    for(let i = 0;i<8;i++)
    {
        for(let j = 0;j<8;j++)
        {
            let element = document.getElementsByClassName(`${i}x${j}`)[0];
            let newClassName = `${i}x${j} ${element.className.includes('white')?'white':'blue'} ${share.pieceNumToString[chessBoard[i][j]]}`;
            if(possibleMoves.some((move)=>{
                return move.x==j&&move.y==i;
              })){
                newClassName += " green";
              }
              else if((chessBoard[i][j]==share.wRege && isChess=='w') || (chessBoard[i][j]==share.bRege && isChess == 'b')){
                newClassName += " check";
              }
              else if(lastMove != null &&((i == lastMove.fy && j == lastMove.fx) ||(i == lastMove.ty && j == lastMove.tx))){
                newClassName += " lastmove";
              }
            element.className = newClassName;
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
let startOfGame = null;

let gameFinishDisplayed = false;
setInterval(()=>{
    if(gameFinishDisplayed) return;
    if(isCheckMate)
    {
        gameFinishDisplayed = true;
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
        gameFinishDisplayed = true;
        document.getElementById("info_him").innerHTML = `<h1>Game aborted.</h1><form action="/play" method="get">
        <button type="submit" class = "play_button">
            <h2>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspPlay&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</h2>
        </button>
    </form>`
    }
    
    else if(!started)
    {
        document.getElementById("info_him").innerHTML = "<h2>Waiting for another player</h2>"
        document.getElementById("info_you").innerHTML = ""
    }
    else
    {
        let secondsLeft = Math.ceil((seconds-(Date.now()-last_turn_time)/1000))
        let minutesLeft = Math.floor(secondsLeft/60);
        secondsLeft = secondsLeft%60;
        if(myTurn)
        {
            document.getElementById("info_you").innerHTML = `<h1 class = "time">${minutesLeft<10?'0':''}${minutesLeft}:${secondsLeft<10?'0':''}${secondsLeft}</h1>`;
            document.getElementById("info_him").innerHTML = "";
        }
        else
        {
            document.getElementById("info_him").innerHTML = `<h1 class = "time">${minutesLeft<10?'0':''}${minutesLeft}:${secondsLeft<10?'0':''}${secondsLeft}</h1>`;
            document.getElementById("info_you").innerHTML = "";
        }

        let secondsPassed = Math.ceil((Date.now() - startOfGame)/1000);
        let minutesPassed = Math.floor(secondsPassed/60);

        secondsPassed %= 60;

        document.getElementById("stats").innerHTML = `<h2 class = "stats">${minutesPassed<10?'0':''}${minutesPassed}:${secondsPassed<10?'0':''}${secondsPassed}<br>Current turn #: ${allMoves.length+1}</h2>`
    }
},100);

setInterval(()=>{
    if(myTurn && started && !isCheckMate && !gameAborted)
        new Audio("../sounds/tock.wav").play();

},1000);

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
    if(startOfGame == null)
        startOfGame = Date.now();
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
};


function onBoardClick(element) {
    if(!myTurn) return;

    let x = parseInt(element.className[2]);
    let y = parseInt(element.className[0]);
    if(onSelection && (share.colorOfPiece(chessBoard[y][x]) != 'w' && amIWhite) ||
    (share.colorOfPiece(chessBoard[y][x]) != 'b' && !amIWhite))
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
                let isValid = share.validMoveChecker[chessBoard[y][x]](share.flipTable(chessBoard), 7-x, 7-y, 7-j, 7-i, allMoves);
                if(isValid!=false)
                {
                    let tempBoard = JSON.parse(JSON.stringify(chessBoard));
                    tempBoard[i][j] = tempBoard[y][x];
                    tempBoard[y][x] = share.empty;
                    if(isValid == 'passant'){
                        tempBoard[y][j] = share.empty
                      }
                      else if(isValid == 'rocadar') {
                        let dir = (x>j)?-1:1;
                        tempBoard[i][j-dir] = tempBoard[i][j+dir]
                        tempBoard[i][j+dir] = share.empty;
                      }
                      else if(isValid == 'rocadal') {
                        let dir = (x>j)?-1:1;
                        tempBoard[i][j-dir] = tempBoard[i][j+dir+dir]
                        tempBoard[i][j+dir+dir] = share.empty;
                      }
                    if(!(share.isSah(amIWhite?tempBoard:share.flipTable(tempBoard)).includes(share.colorOfPiece(chessBoard[y][x]))))
                        possibleMoves.push({x:j,y:i});
                }
            }
        }
        drawTable(chessBoard, isChess, possibleMoves, lastMove);
    }
}