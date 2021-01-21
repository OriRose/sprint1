'use strict'
const MINE = '💣';
const FLAG = '🚩';
const SMILEY = '🙂';
const DEAD_SMILEY = '💀';
const COOL_SMILEY = '😎';

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
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = SMILEY;
    gGame.shownCount = 0;
    document.body.classList.add('default-background')
    document.body.classList.remove('lose-background')
    document.body.classList.remove('win-background')
    document.querySelector('.timer').style.color = "white"
    document.querySelector('.mines-counter').style.color = "white"
    document.querySelector('.instructions').style.color = "white"
}

function getDifficulty(difficulty) {
    if (gGame.isTimerOn) {
        var elModal = document.querySelector('.modal');
        elModal.style.display = 'block';
        var elModalText = document.querySelector('.modal-text span');
        elModalText.innerText = difficulty;
        var elBtn = document.querySelector('.restart-button');
        elBtn.setAttribute("onclick", `setDifficulty('${difficulty}')`)
        console.log(elBtn.getAttribute("onclick"))
    }
    else {
        setDifficulty(difficulty);
    }
}

function setDifficulty(difficulty) {
    closeModal();
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, isTimerOn: false };
    clearInterval(gGameInterval);
    updateTimer();
    switch (difficulty) {
        case 'beginner':
            gLevel = { SIZE: 4, MINES: 2 };
            break;
        case 'medium':
            gLevel = { SIZE: 8, MINES: 12 };
            break;
        case 'expert':
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
    if (gBoard[i][j].isShown) return null;
    if (!gGame.isTimerOn) {
        gGame.isTimerOn = true;
        gGameInterval = setInterval(timerTick, 1000);
        var minesPlacedCount = 0;
        while (minesPlacedCount < gLevel.MINES) {
            var randomI = getRandomInt(0, gLevel.SIZE - 1);
            var randomJ = getRandomInt(0, gLevel.SIZE - 1);
            if (randomI > i - 2 && randomI < i + 2 && randomJ > j - 2 && randomJ < j + 2) continue;
            if (!gBoard[randomI][randomJ].isMine) {
                gBoard[randomI][randomJ].isMine = true;
                gBoard[randomI][randomJ].minesAroundCount = NaN;
                minesPlacedCount++;
            }
        }

        setMinesNegsCount(gBoard);
    }
    if (gGame.isOn && !gBoard[i][j].isMarked) {
        gBoard[i][j].isShown = true;
        elCell.classList.add('shown');
        gGame.shownCount++;
        if (gBoard[i][j].isMine) {
            var elSmiley = document.querySelector('.smiley');
            elSmiley.innerText = DEAD_SMILEY;
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

        checkGameOver();
    }
}

function checkGameOver() {
    if (gGame.shownCount + gLevel.MINES === Math.pow(gLevel.SIZE, 2)) {
        if (!allMinesMarked()) return false;
        var elSmiley = document.querySelector('.smiley');
        elSmiley.innerText = COOL_SMILEY;
        var audio = new Audio('victory.mp3');
        audio.play();
        document.body.classList.remove('default-background')
        document.body.classList.add('win-background')
        document.querySelector('.timer').style.color = "black"
        document.querySelector('.mines-counter').style.color = "black"
        document.querySelector('.instructions').style.color = "black"
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
            gBoard[i][j].isShown = true;
            console.log('shownCount: ', gGame.shownCount);
            checkGameOver();
            if (gBoard[i][j].minesAroundCount > 0) {
                renderCell({ i: i, j: j }, gBoard[i][j].minesAroundCount);
            }
            else if (gBoard[i][j].minesAroundCount === 0) {
                expandShown(gBoard, i, j)
            }
        }
    }
}

function blowUp(elCell) {
    elCell.classList.add('blown');
    var audio = new Audio('sadtrombone.mp3');
    audio.play();
    document.body.classList.remove('default-background')
    document.body.classList.add('lose-background')
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

function closeModal() {
    var elModal = document.querySelector('.modal');
    elModal.style.display = 'none';
}

function allMinesMarked() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine && !gBoard[i][j].isMarked) return false;
        }
    }
    return true;
}

function smileyClicked(){
    endGame();
    gGame.secsPassed = 0;
    updateTimer();
    initGame();
}