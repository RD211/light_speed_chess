const websocket = require("ws");

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

function colorOfPiece(piece)
{
  return piece<=5?'w':(piece == empty)?null:'b';
}
//#endregion

// We consider every move as being from a black object(top of board)


checkPawn = function(board, fx, fy, tx, ty){
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

checkCal = function(board, fx, fy, tx, ty){
  let colorFrom = colorOfPiece(board[fy][fx]);
  let colorTo = colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == empty)  return false;
  if(colorTo == colorFrom) return false;
  let dx = Math.abs(fx-tx);
  let dy = Math.abs(fy-ty);
  return JSON.stringify([dx,dy].sort()) == JSON.stringify([1,2]);
};

checkNebun = function(board, fx, fy, tx, ty){
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

checkTura = function(board, fx, fy, tx, ty){
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
checkRegina = function(board, fx, fy, tx, ty) {
  return checkNebun(board,fx,fy,tx,ty) || checkTura(board,fx,fy,tx,ty);
};

checkKing = function(board, fx,fy,tx,ty) {
  let colorFrom = colorOfPiece(board[fy][fx]);
  let colorTo = colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == empty)  return false;
  if(colorTo == colorFrom) return false;
  return Math.abs(fx-tx) <= 1 && Math.abs(fy-ty) <= 1;
};

validMoveChecker = {
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

const game = function(gameID) {
  this.playerA = null;
  this.playerB = null;
  this.board = [
    [bTurn, bCal, bNebun, bRegina, bRege, bNebun, bCal, bTurn],
    Array(8).fill(bPieton),
    Array(8).fill(empty),
    Array(8).fill(empty),
    Array(8).fill(empty),
    Array(8).fill(empty),
    Array(8).fill(wPieton),
    [wTurn, wCal, wNebun, wRegina, wRege, wNebun, wCal, wTurn],];
  this.currentMove = null;
  this.id = gameID;
  this.last_turn_time = Date.now();
  this.extraTimeA = 0;
  this.extraTimeB = 0;
  this.moveCount = 0;
  this.chess = null;
  this.last_move = null;
};

game.prototype.hasTwoConnectedPlayers = function() {
  return this.playerA != null && this.playerB != null;
};


game.prototype.addPlayer = function(p) {
  if (this.playerB != null) {
    return new Error(
      `Invalid call to addPlayer`
    );
  }

  if (this.playerA == null) {
    this.playerA = p;
    return "White";
  } else {
    this.currentMove = this.playerA;
    this.last_turn_time = Date.now();
    this.playerB = p;
    let currentMoveCount = this.moveCount;
    setTimeout(()=>{
      if(this.moveCount == currentMoveCount){
        let moves = this.getAllMoves();
        this.performMove(this.currentMove,moves[Math.random()*moves.length]);
      }
    }, (5 + (this.currentMove==this.playerA?this.extraTimeA:this.extraTimeB))*1000);
    return "Black";
  }
};

game.prototype.getAllMoves = function() {
  possibleMoves = [];

  for(let y = 0;y<8;y++)
  {
    for(let x = 0;x<8;x++)
    {
      if(this.currentMove == this.playerA && colorOfPiece(this.board[y][x])=='w'){
        for(let i = 0;i<8;i++)
        {
            for(let j = 0;j<8;j++)
            {
                if(validMoveChecker[this.board[y][x]](flipTable(this.board), 7-x, 7-y, 7-j, 7-i))
                {
                    let tempBoard = flipTable(JSON.parse(JSON.stringify(this.board)));
                    tempBoard[7-i][7-j] = tempBoard[7-y][7-x];
                    tempBoard[7-y][7-x] = empty;
                    if(isSah(tempBoard) != colorOfPiece(this.board[y][x]))
                      possibleMoves.push({fx:x,fy:y,tx:j,ty:i});
                  }
            }
        }
      }
      else if(this.currentMove == this.playerB && colorOfPiece(this.board[y][x])=='b')
      {
        for(let i = 0;i<8;i++)
        {
            for(let j = 0;j<8;j++)
            {
              if(validMoveChecker[this.board[y][x]](this.board, x, y, j, i))
              {
                    let tempBoard = JSON.parse(JSON.stringify(this.board));
                    tempBoard[i][j] = tempBoard[y][x];
                    tempBoard[y][x] = empty;
                    if(!isSah(tempBoard))
                        possibleMoves.push({fx:7-x,fy:7-y,tx:7-j,ty:7-i});
               }
            }
        }
      }
    }
  }
  return possibleMoves;
};

game.prototype.isValidMove = function(con, move) {
    if(this.currentMove != con)
      return false;
    
    let newBoard = JSON.parse(JSON.stringify(this.board));
    let isPlayerA = con == this.playerA;
    let fx = move['fx'];
    let fy = move['fy'];
    let tx = move['tx'];
    let ty = move['ty'];


    if(!isPlayerA)
    {
      fx = 7-fx;
      fy = 7-fy;
      tx = 7-tx;
      ty = 7-ty;
    }

    let isPlayerAPiece = colorOfPiece(newBoard[fy][fx])=="w";
    if(isPlayerAPiece != isPlayerA)
      return false;
    console.log(validMoveChecker[newBoard[fy][fx]]);
    console.log([fx,fy,tx,ty].toString());
    let technicallyValid = false;
    if(isPlayerA)
    {
      let technicallyValid = validMoveChecker[newBoard[fy][fx]](flipTable(newBoard), 7-fx,7-fy,7-tx,7-ty);
      newBoard[ty][tx] = newBoard[fy][fx];
      newBoard[fy][fx] = empty;
      return technicallyValid && isSah(newBoard)!='w';
    }
    technicallyValid = validMoveChecker[newBoard[fy][fx]](newBoard, fx, fy, tx, ty);
    newBoard[ty][tx] = newBoard[fy][fx];
    newBoard[fy][fx] = empty;
    return technicallyValid && isSah(newBoard)!='b';
  };

game.prototype.performMove = function(con, move) {
    let isPlayerA = con==this.playerA;
    if(move!=null){
      let fx = move['fx'];
      let fy = move['fy'];
      let tx = move['tx'];
      let ty = move['ty'];
      if(!isPlayerA)
      {
        fx = 7-fx;
        fy = 7-fy
        tx = 7-tx;
        ty = 7-ty;
      }

      this.board[ty][tx] = this.board[fy][fx];
      this.board[fy][fx] = empty;
      this.last_move = {fx:fx,fy:fy,tx:tx,ty:ty};
    }

    if(isPlayerA)
      this.currentMove = this.playerB;
    else
      this.currentMove = this.playerA;
    this.last_turn_time = Date.now();

    this.moveCount++;

    let currentMoveCount = this.moveCount;
    setTimeout(()=>{
      if(this.moveCount == currentMoveCount){
        let moves = this.getAllMoves();
        this.performMove(this.currentMove,moves[Math.random()*moves.length]);
      }
    }, (5 + (this.currentMove==this.playerA?this.extraTimeA:this.extraTimeB))*1000);

    this.chess = isSah(this.board);
    if(this.playerA != null)
    this.playerA.send(JSON.stringify(this.getState(this.playerA)))
    if(this.playerB != null)
    this.playerB.send(JSON.stringify(this.getState(this.playerB)))
    if(this.isCheckMate()==true) this.close();
};

game.prototype.close = function() {
  try {
    this.playerA.close();
    this.playerA = null;
  } catch (e) {
    console.log("Player A closing: " + e);
  }

  try {
    this.playerB.close();
    this.playerB = null;
  } catch (e) {
    console.log("Player B closing: " + e);
  }
};

game.prototype.isCheckMate = function(){
  return this.getAllMoves().length == 0;
}

game.prototype.getBoard = function(con){
    if(this.playerB==con){
      return flipTable(this.board);
    }
    return this.board;
};

game.prototype.getState = function(con) {
  return {board:this.getBoard(con),
    yourTurn: this.currentMove==con,
    seconds: 5 + (this.currentMove==this.playerA?this.extraTimeA:this.extraTimeB),
    last_turn_time:this.last_turn_time,
    started: this.playerB!=null,
    isSah: this.chess,
    isCheckMate: this.isCheckMate(),
    moveCount:this.moveCount,
    last_move: (this.playerA==con || this.last_move==null)?this.last_move:{
      fx:7-this.last_move.fx,
      fy:7-this.last_move.fy,
      tx:7-this.last_move.tx,
      ty:7-this.last_move.ty,
    }};
}

module.exports = game;