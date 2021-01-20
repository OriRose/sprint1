'use strict'
const MINE = '💣';
const FLAG = '🚩';

var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, isTimerOn: false };
var gLevel = { SIZE: 4, MINES: 2 };
var gBoard;
var gGameInterval;



function initGame() {
    gBoard = buildBoard();
    renderBoard(gBoard);
    gGame.isOn = true;
    var elCounter = document.querySelector('.mines-counter span');
    elCounter.innerText = gLevel.MINES;
}

function setDifficulty(difficulty) {
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, isTimerOn: false };
    clearInterval(gGameInterval);
    updateTimer();
    switch (difficulty) {
        case 'easy':
            gLevel = { SIZE: 4, MINES: 2 };
            break;
        case 'medium':
            gLevel = { SIZE: 8, MINES: 12 };
            break;
        case 'hard':
            gLevel = { SIZE: 12, MINES: 30 };
            break;
    }
    initGame()
}

function buildBoard() {

    var board = createMat(gLevel.SIZE, gLevel.SIZE)

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j] = {
                minesAroundCount: 0, isShown: false, isMine: false, isMarked: false
            }
        }
    }

    var minesPlacedCount = 0;
    while (minesPlacedCount < gLevel.MINES) {
        var randomI = getRandomInt(0, gLevel.SIZE - 1);
        var randomJ = getRandomInt(0, gLevel.SIZE - 1);
        if (!board[randomI][randomJ].isMine) {
            board[randomI][randomJ].isMine = true;
            board[randomI][randomJ].minesAroundCount = NaN;
            minesPlacedCount++;
        }
    }

    setMinesNegsCount(board);

    return board;
}

function setMinesNegsCount(board) {
    for (var i = 0; i <= board.length - 1; i++) {
        for (var j = 0; j <= board.length - 1; j++) {
            if (!board[i][j].isMine) {
                var count = countNeighbors(i, j, board);
                board[i][j].minesAroundCount = count;
            }
        }
    }
}

function countNeighbors(cellI, cellJ, mat) {
    var countNegs = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= mat[i].length) continue;
            if (mat[i][j].isMine) countNegs++;
        }
    }
    return countNegs;
}

function renderBoard(board) {

    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {

            var cellClass = getClassName({ i: i, j: j })

            strHTML += '\t<td class="cell ' + cellClass +
                '"  onclick="cellClicked(this,' + i + ',' + j + ')' +
                '"  oncontextmenu="cellMarked(' + i + ',' + j + ')">\n';

            strHTML += '\t</td>\n';
        }
        strHTML += '</tr>\n';
    }

    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
    elBoard.addEventListener('contextmenu', event => event.preventDefault()); //context menu be damned! >:D
}

function cellClicked(elCell, i, j) {
    if (!gGame.isTimerOn) {
        gGame.isTimerOn = true;
        gGameInterval = setInterval(timerTick, 1000);
    }
    if (gGame.isOn && !gBoard[i][j].isMarked) {
        gBoard[i][j].isShown = true;
        elCell.classList.add('shown');
        gGame.shownCount++;
        if (gBoard[i][j].isMine) {
            for (var n = 0; n < gLevel.SIZE; n++) {
                for (var m = 0; m < gLevel.SIZE; m++) {
                    if (gBoard[n][m].isMine) {
                        renderCell({ i: n, j: m }, MINE);
                    }
                }
            }
            blowUp(elCell);
        }
        else if (gBoard[i][j].minesAroundCount > 0) {
            var value = (gBoard[i][j].minesAroundCount > 0) ? gBoard[i][j].minesAroundCount : '';
            renderCell({ i: i, j: j }, value)
            checkGameOver();
        }
        else {
            expandShown(gBoard, i, j)
        }
    }
}

function cellMarked(i, j) {
    if (!gBoard[i][j].isShown && gGame.isOn) {
        var value = (gBoard[i][j].isMarked) ? '' : FLAG;
        renderCell({ i: i, j: j }, value);

        var unmarkedDiff = (gBoard[i][j].isMarked) ? 1 : -1;
        var elCounter = document.querySelector('.mines-counter span');
        elCounter.innerText = parseInt(elCounter.innerText) + unmarkedDiff;

        gBoard[i][j].isMarked = !gBoard[i][j].isMarked
    }
}

function checkGameOver() {
    if (gGame.shownCount + gLevel.MINES === Math.pow(gLevel.SIZE, 2)) {
        var audio = new Audio('victory.wav');
        audio.play();
        endGame();
    }
}

function expandShown(board, cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= board[i].length) continue;
            if (gBoard[i][j].isShown) continue;
            var elCurrCell = document.querySelector(`.cell-${i}-${j}`);
            elCurrCell.classList.add('shown');
            gGame.shownCount++;
            console.log('shownCount: ', gGame.shownCount);
            checkGameOver();
            if (gBoard[i][j].minesAroundCount > 0) {
                renderCell({ i: i, j: j }, gBoard[i][j].minesAroundCount);
            }
            //full expand is WIP, currently results in an infinite loop ):
            // else if (gBoard[i][j].minesAroundCount === 0) {
            //     expandShown(gBoard, i, j)
            // }
        }
    }
}


function blowUp(elCell) {
    elCell.classList.add('blown');
    var audio = new Audio('fatality.mp3');
    audio.play();
    endGame();
}

function timerTick() {
    gGame.secsPassed++;
    updateTimer();
}

function updateTimer() {
    var elTimer = document.querySelector('.timer span');
    elTimer.innerText = gGame.secsPassed;
}

function endGame() {
    gGame.isOn = false;
    clearInterval(gGameInterval);
    gGame.isTimerOn = false;
}