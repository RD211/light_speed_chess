const share = require('./public/javascripts/share.js')
const gameStatus = require('./statTracker.js')
const game = function(gameID) {
  this.playerWhite = null;
  this.playerBlack = null;
  this.board = [
    [share.bTurn, share.bCal, share.bNebun, share.bRege, share.bRegina, share.bNebun, share.bCal, share.bTurn],
    Array(8).fill(share.bPieton),
    Array(8).fill(share.empty),
    Array(8).fill(share.empty),
    Array(8).fill(share.empty),
    Array(8).fill(share.empty),
    Array(8).fill(share.wPieton),
    [share.wTurn, share.wCal, share.wNebun, share.wRegina, share.wRege, share.wNebun, share.wCal, share.wTurn],];
  this.currentMove = null;
  this.id = gameID;
  this.last_turn_time = Date.now();
  this.extraTimeWhite = 0;
  this.extraTimeBlack = 0;
  this.moveCount = 0;
  this.chess = null;
  this.moves = [];
  this.isOn = false;
};

game.prototype.hasTwoConnectedPlayers = function() {
  return this.playerWhite != null && this.playerBlack != null;
};


game.prototype.addPlayer = function(p) {

  if (this.playerWhite == null) {
    this.playerWhite = p;
    return "White";
  } else {
    this.currentMove = this.playerWhite;
    this.last_turn_time = Date.now();
    this.playerBlack = p;
    this.isOn = true;
    let currentMoveCount = this.moveCount;
    setTimeout(()=>{
      if(this.moveCount == currentMoveCount && this.isOn){
        let moves = this.getAllMoves();
        if(this.currentMove == this.playerWhite)
          this.extraTimeWhite++;
        else
          this.extraTimeBlack++;

        let move = moves[Math.floor(Math.random()*moves.length)];
        console.log(`Server performing move for game ${this.id} for ${this.currentMove==this.playerWhite?"White":"Black"} moving: `+
        (this.currentMove==this.playerWhite?share.pieceNumToString[this.board[move.fy][move.fx]]:
        share.pieceNumToString[this.board[7-move.fy][7-move.fx]]));
        this.performMove(this.currentMove, move, this.isValidMove(move));   
      }
    }, (5 + (this.currentMove==this.playerWhite?this.extraTimeWhite:this.extraTimeBlack))*1000);
    
    return "Black";
  }
};

game.prototype.getAllMoves = function() {
  possibleMoves = [];

  for(let y = 0;y<8;y++)
  {
    for(let x = 0;x<8;x++)
    {
      if(this.currentMove == this.playerWhite && share.colorOfPiece(this.board[y][x])=='w'){
        for(let i = 0;i<8;i++)
        {
            for(let j = 0;j<8;j++)
            {
                let isValid = share.validMoveChecker[this.board[y][x]](share.flipTable(this.board), 7-x, 7-y, 7-j, 7-i, this.moves);
                if(isValid != false)
                {
                    let tempBoard = share.flipTable(JSON.parse(JSON.stringify(this.board)));
                    tempBoard[7-i][7-j] = tempBoard[7-y][7-x];
                    tempBoard[7-y][7-x] = share.empty;
                    if(isValid == 'passant')
                      tempBoard[7-y][7-j] = share.empty
                    else if(isValid == 'rocadar') {
                      let dir = (7-x>7-j)?-1:1;
                      tempBoard[7-i][7-j-dir] = tempBoard[7-i][7-j+dir]
                      tempBoard[7-i][7-j+dir] = share.empty;
                    }
                    else if(isValid == 'rocadal') {
                      let dir = (7-x>7-j)?-1:1;
                      tempBoard[7-i][7-j-dir] = tempBoard[7-i][7-j+dir+dir]
                      tempBoard[7-i][7-j+dir+dir] = share.empty;
                    }
                    if(!(share.isSah(share.flipTable(tempBoard)).includes(share.colorOfPiece(this.board[y][x]))))
                      possibleMoves.push({fx:x,fy:y,tx:j,ty:i});
                }
            }
        }
      }
      else if(this.currentMove == this.playerBlack && share.colorOfPiece(this.board[y][x])=='b')
      {
        for(let i = 0;i<8;i++)
        {
            for(let j = 0;j<8;j++)
            {
              let isValid = share.validMoveChecker[this.board[y][x]](this.board, x, y, j, i, this.moves)
              if(isValid != false)
              {
                    let tempBoard = JSON.parse(JSON.stringify(this.board));
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
                    if(!(share.isSah(tempBoard).includes(share.colorOfPiece(this.board[y][x]))))
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
    let isPlayerWhite = con == this.playerWhite;
    let fx = move['fx'];
    let fy = move['fy'];
    let tx = move['tx'];
    let ty = move['ty'];


    if(!isPlayerWhite)
    {
      fx = 7-fx;
      fy = 7-fy;
      tx = 7-tx;
      ty = 7-ty;
    }

    let isPlayerWhitePiece = share.colorOfPiece(newBoard[fy][fx])=="w";
    if(isPlayerWhitePiece != isPlayerWhite)
      return false;

    let technicallyValid = false;
    if(isPlayerWhite)
    {
      let technicallyValid = share.validMoveChecker[newBoard[fy][fx]](share.flipTable(newBoard), 7-fx,7-fy,7-tx,7-ty, this.moves);
      newBoard[ty][tx] = newBoard[fy][fx];
      newBoard[fy][fx] = share.empty;
      if(technicallyValid == 'passant')
        newBoard[fy][tx] = share.empty
      else if(technicallyValid == 'rocadar') {
        let dir = (fx>tx)?-1:1;
        newBoard[ty][tx-dir] = newBoard[ty][tx+dir]
        newBoard[ty][tx+dir] = share.empty;
      }
      else if(technicallyValid == 'rocadal') {
        let dir = (fx>tx)?-1:1;
        newBoard[ty][tx-dir] = newBoard[ty][tx+dir+dir]
        newBoard[ty][tx+dir+dir] = share.empty;
      }
      return (technicallyValid != false && !(share.isSah(newBoard).includes('w')))?technicallyValid:false;
    }
    technicallyValid = share.validMoveChecker[newBoard[fy][fx]](newBoard, fx, fy, tx, ty, this.moves);
    newBoard[ty][tx] = newBoard[fy][fx];
    newBoard[fy][fx] = share.empty;
    if(technicallyValid == 'passant')
        newBoard[fy][tx] = share.empty
    else if(technicallyValid == 'rocadar') {
      let dir = (fx>tx)?-1:1;
      newBoard[ty][tx-dir] = newBoard[ty][tx+dir]
      newBoard[ty][tx+dir] = share.empty;
    }
    else if(technicallyValid == 'rocadal') {
      let dir = (fx>tx)?-1:1;
      newBoard[ty][tx-dir] = newBoard[ty][tx+dir+dir]
      newBoard[ty][tx+dir+dir] = share.empty;
    }
    return (technicallyValid != false && !(share.isSah(newBoard).includes('b')))?technicallyValid:false;
};

game.prototype.performMove = function(con, move, special) {
    let isPlayerWhite = con==this.playerWhite;
    if(move!=null){
      let fx = move['fx'];
      let fy = move['fy'];
      let tx = move['tx'];
      let ty = move['ty'];
      if(!isPlayerWhite)
      {
        fx = 7-fx;
        fy = 7-fy
        tx = 7-tx;
        ty = 7-ty;
      }
      
      let piece = this.board[fy][fx];
      this.board[ty][tx] = this.board[fy][fx];
      this.board[fy][fx] = share.empty;
      if(special == 'passant')
        this.board[fy][tx] = share.empty;
      else if(special == 'rocadar') {
        let dir = (fx>tx)?-1:1;
        this.board[ty][tx-dir] = this.board[ty][tx+dir]
        this.board[ty][tx+dir] = share.empty;
      }
      else if(special == 'rocadal') {
        let dir = (fx>tx)?-1:1;
        this.board[ty][tx-dir] = this.board[ty][tx+dir+dir]
        this.board[ty][tx+dir+dir] = share.empty;
      }
      
      this.moves.push({fx:fx,fy:fy,tx:tx,ty:ty,piece:piece});
      let temp = this.moves[0]
      this.moves[0] = this.moves[this.moves.length-1]
      this.moves[this.moves.length-1] = temp
    }

    if(isPlayerWhite)
      this.currentMove = this.playerBlack;
    else
      this.currentMove = this.playerWhite;

    this.moveCount++;

    let currentMoveCount = this.moveCount;
    setTimeout(()=>{
      if(this.moveCount == currentMoveCount && this.isOn){
        let moves = this.getAllMoves();
        if(this.currentMove == this.playerWhite)
          this.extraTimeWhite++;
        else
          this.extraTimeBlack++;
        let move = moves[Math.floor(Math.random()*moves.length)];
        console.log(`Server performing move for game ${this.id} for ${this.currentMove==this.playerWhite?"White":"Black"} moving: `+
        (this.currentMove==this.playerWhite?share.pieceNumToString[this.board[move.fy][move.fx]]:
        share.pieceNumToString[this.board[7-move.fy][7-move.fx]]));
        this.performMove(this.currentMove, move, this.isValidMove(move));
      }
    }, (5 + (this.currentMove==this.playerWhite?this.extraTimeWhite:this.extraTimeBlack))*1000);
    this.last_turn_time = Date.now();
    this.chess = share.isSah(this.board);
    
    if(this.playerWhite != null)
    this.playerWhite.send(JSON.stringify(this.getState(this.playerWhite)))
    if(this.playerBlack != null)
    this.playerBlack.send(JSON.stringify(this.getState(this.playerBlack)))
    if(this.isCheckMate()==true) this.close();
};

game.prototype.close = function(reason) {
  try {
    this.playerWhite.close();
    this.playerWhite = null;
  } catch (e) {
    console.log("Player White closing: " + e);
  }

  try {
    this.playerBlack.close();
    this.playerBlack = null;
  } catch (e) {
    console.log("Player Black closing: " + e);
  }
  this.isOn = false;
  if(reason != 'aborted'){
    console.log(`Game(id: ${this.id}) finished.`);
    gameStatus.gamesCompleted++;
  }
};

game.prototype.isCheckMate = function(){
  return this.getAllMoves().length == 0;
}

game.prototype.getBoard = function(con){
    if(this.playerBlack==con){
      return share.flipTable(this.board);
    }
    return this.board;
};

game.prototype.getState = function(con) {
  return {board:this.getBoard(con),
    yourTurn: this.currentMove==con,
    seconds: 5 + (this.currentMove==this.playerWhite?this.extraTimeWhite:this.extraTimeBlack),
    last_turn_time:this.last_turn_time,
    started: this.playerBlack!=null,
    isSah: this.chess,
    isCheckMate: this.isCheckMate(),
    moveCount:this.moveCount,
    moves: this.moves,
    last_move: (this.playerWhite==con || this.moves.length==0)?this.moves[0]:{
      fx:7-this.moves[0].fx,
      fy:7-this.moves[0].fy,
      tx:7-this.moves[0].tx,
      ty:7-this.moves[0].ty,
    }};
}

module.exports = game;