(function(exports){
exports.wPieton = 0;
exports.wCal = 1;
exports.wTurn = 2;
exports.wRege = 3;
exports.wRegina = 4;
exports.wNebun = 5;
exports.bPieton = 6;
exports.bCal = 7;
exports.bTurn = 8;
exports.bRege = 9;
exports.bRegina = 10;
exports.bNebun = 11;
exports.empty = 12;

exports.colorOfPiece = function (piece)
{
  return piece<=5?'w':(piece == exports.empty)?null:'b';
}

exports.checkPawn = function(board, fx, fy, tx, ty, moves){
  if(fy>=ty) return false;
  let dest = board[ty][tx];
  let colorFrom = exports.colorOfPiece(board[fy][fx]);
  let colorTo = exports.colorOfPiece(board[ty][tx]);
  if(board[fy][fx]==exports.empty)  return false;
  if(colorTo == colorFrom) return false;

  if(fx==tx)
  {
    if(ty-fy==1 && dest == exports.empty)
      return true;
    if(ty-fy==2 && fy==1 && dest == exports.empty && board[fy+1][tx] == exports.empty)
      return true;
  }
  else if(Math.abs(fx-tx)==1)
  {
    if(ty-fy==1 && dest != exports.empty)
      return true;
    if(ty-fy==1 && typeof moves !== 'undefined' && moves.length>0){
      let move = moves[0]
      if(colorFrom == 'w') move = {fx:7-move.fx, fy: 7-move.fy, tx: 7-move.tx, ty: 7-move.ty}
      if(move.fy == ty+1 && move.fx == tx && 
      (board[move.ty][move.tx] == exports.wPieton ||
        board[move.ty][move.tx] == exports.bPieton) && 
        exports.colorOfPiece(board[move.ty][move.tx])!=colorFrom)
        return 'passant';
    }
  }
  return false;
};

exports.checkCal = function(board, fx, fy, tx, ty, moves){
  let colorFrom = exports.colorOfPiece(board[fy][fx]);
  let colorTo = exports.colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == exports.empty)  return false;
  if(colorTo == colorFrom) return false;
  let dx = Math.abs(fx-tx);
  let dy = Math.abs(fy-ty);
  return JSON.stringify([dx,dy].sort()) == JSON.stringify([1,2]);
};

exports.checkNebun = function(board, fx, fy, tx, ty, moves){
  let colorFrom = exports.colorOfPiece(board[fy][fx]);
  let colorTo = exports.colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == exports.empty)  return false;
  if(colorTo == colorFrom) return false;
  if(Math.abs(fx-tx)!=Math.abs(ty-fy)) return false;
  let addX = tx>fx?1:-1;
  let addY = ty>fy?1:-1;
  for(let i = 1; fx+i*addX != tx;i++)
  {
    if(board[fy+i*addY][fx+i*addX] != exports.empty)
      return false;
  }
  return true;
};

exports.checkTura = function(board, fx, fy, tx, ty, moves){
  let colorFrom = exports.colorOfPiece(board[fy][fx]);
  let colorTo = exports.colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == exports.empty)  return false;
  if(colorTo == colorFrom) return false;
  if(Math.abs(fx-tx)!=0 &&
     Math.abs(ty-fy) != 0) return false;
  let addX = tx>fx?1:tx<fx?-1:0;
  let addY = ty>fy?1:ty<fy?-1:0;
  for(let i = 1; fx+i*addX != tx || fy+i*addY != ty;i++)
  {
    if(board[fy+i*addY][fx+i*addX] != exports.empty)
      return false;
  }
  return true;
};
exports.checkRegina = function(board, fx, fy, tx, ty, moves) {
  return exports.checkNebun(board,fx,fy,tx,ty) || exports.checkTura(board,fx,fy,tx,ty);
};

exports.checkKing = function(board, fx,fy,tx,ty,moves) {
  let colorFrom = exports.colorOfPiece(board[fy][fx]);
  let colorTo = exports.colorOfPiece(board[ty][tx]);
  if(board[fy][fx] == exports.empty)  return false;
  if(colorTo == colorFrom) return false;

  //TODO: MUST CHECK IF KING EVER MOVED OR ROOK
  //Maybe some bugs
  if(Math.abs(fy-ty)==0 && Math.abs(fx-tx)<=3 && Math.abs(fx-tx)>=2)
  {
    let direction = (fx>tx)?-1:1;
    if(board[ty][fx+direction]!=exports.empty) return false;
    if(board[ty][fx+direction+direction]!=exports.empty) return false;
    if(direction + tx <= 7 && direction+tx >= 0)
    {
      if((board[ty][direction+tx] == exports.wTurn ||
        board[ty][direction+tx] == exports.bTurn)&&
        exports.colorOfPiece(board[ty][direction+tx]) == colorFrom){
          return 'rocada';
        }
    }
  }
  return Math.abs(fx-tx) <= 1 && Math.abs(fy-ty) <= 1;
};

exports.validMoveChecker = {
  0: exports.checkPawn,
  1: exports.checkCal,
  2: exports.checkTura,
  3: exports.checkKing,
  4: exports.checkRegina,
  5: exports.checkNebun,
  6: exports.checkPawn,
  7: exports.checkCal,
  8: exports.checkTura,
  9: exports.checkKing,
  10:exports.checkRegina,
  11:exports.checkNebun,
  12: ()=>false,
};

exports.isSah = function(board) {

  let whiteKingPos = null;
  let blackKingPos = null;

  for(let y = 0;y<8;y++)
  {
    for(let x = 0;x<8;x++)
    {
      if(board[y][x]==exports.wRege)
        whiteKingPos = {x:x, y:y};
      if(board[y][x]==exports.bRege)
        blackKingPos = {x:x, y:y};
    }
  }
  for(let y = 0;y<8;y++)
  {
    for(let x = 0;x<8;x++)
    {
      let piece = board[y][x];
      if(piece!=exports.empty){
        if(exports.colorOfPiece(piece)=='w')
        {
          if(exports.validMoveChecker[board[y][x]](exports.flipTable(board),7-x,7-y,7-blackKingPos.x, 7-blackKingPos.y))
          {
            return 'b';
          }
        }
        else
        {
          if(exports.validMoveChecker[board[y][x]](board,x,y,whiteKingPos.x, whiteKingPos.y))
          {
            return 'w';
          }
        }
      }
    }
  }
  return null;
}


exports.flipTable = function(chessBoard){
  let newBoard = JSON.parse(JSON.stringify(chessBoard));
  return newBoard.map(row=>row.reverse()).reverse();
}

})(typeof exports === 'undefined'? (this.share={}) : exports)