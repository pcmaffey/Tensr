//Helper functions available to both server and client

//drops the active cell --deadCell()-- and if the client still exists, rejoin them to game as a spirit.
//called from drop message confirmation and quit()
//then update play.state

Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" &&
           isFinite(value) &&
           Math.floor(value) === value;
};

getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
