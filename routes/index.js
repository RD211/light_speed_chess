const express = require("express");
const router = express.Router();
const gameStatus = require("../statTracker");



router.get("/play", function(req, res) {
  res.sendFile("game.html", { root: "./public" });
});

/* GET home page */
router.get("/", function(req, res) {
  res.render("splash.ejs", {
    gamesInitialized: gameStatus.gamesInitialized,
    gamesCompleted: gameStatus.gamesCompleted,
    gamesAborted: gameStatus.gamesAborted
  });
});



module.exports = router;