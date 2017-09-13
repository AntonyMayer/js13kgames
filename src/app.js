var selectors = {
    gameArea: "game-area",
    cell: "board__cell",
    target: "board__cell--target",
    puzzle: "board__cell--puzzle",
    board: "board",
    boardTarget: "board--target",
    boardPuzzle: "board--puzzle",
    boardRow: "board__row--target",
    puzzleRow: "board__row--puzzle",
    clue: "board__decor--clue",
    navs: "navs",
    navsElment: "navs__elm",
    circle: "circle",
    ui: { 
      reset: "ui__reset",
      level: "ui__level",
      timer: "timer__elm",
      timerX: "timer__elm--x",
      message: "ui__message",
      lvlUp: "ui__level_up",
      lvlDown: "ui__level_down"
    } 
  }, 
  dimensions = {
    size: 30,
    unit: 'vmin'
  },
  board = document.getElementsByClassName(selectors.boardTarget)[0],
  boardPuzzle = document.getElementsByClassName(selectors.boardPuzzle)[0],
  clue = document.getElementsByClassName(selectors.clue)[0],
  circles = [...document.getElementsByClassName(selectors.circle)],
  containerNavs = document.getElementsByClassName(selectors.navs)[0],
  combinations = 3.99, // 0...3 => 4^4 => 256 
  //dificulty = second to solve the puzzle, 1st lvl => 20sec
  dificulty = 99,
  filters = ['invert', 'sepia', 'saturate'],
  gameArea = document.getElementsByClassName(selectors.gameArea)[0],
  matrix = [], //will be filled on init 
  messageBox = document.getElementsByClassName(selectors.ui.message)[0],
  modelRowTarget = document.getElementsByClassName(selectors.boardRow)[0],
  modelRowPuzzle = document.getElementsByClassName(selectors.puzzleRow)[0],
  puzzles = [], //will be filled on init with puzzles
  targets = [], //will be filled on init with drop areas
  timers = [...document.getElementsByClassName(selectors.ui.timer)],
  state = { 
    level: window.localStorage.getItem('lvl') ? Number(window.localStorage.getItem('lvl')) : 1,
    prevLevel: null,
    topLevel: window.localStorage.getItem('topLvl') ? Number(window.localStorage.getItem('topLvl')) : 1,
    filter: 0,
    timer: dificulty
  };

/**
* Init
**/
init();
setupUI(); 
addNavs();
onDrop(boardPuzzle); //allow drop back to puzzles' area
timerStart(); 

function init() {

setDifficultyLevel(state.level);
  
//update elements arrays
targets = [...gameArea.getElementsByClassName(selectors.target)];
puzzles = [...gameArea.getElementsByClassName(selectors.puzzle)];
 
//update data attributes
updateDataAttributes(targets);
updateDataAttributes(puzzles);

//create random style matrix
randomMatrix();

//style puzzle elements
stylePuzzles();

//show clue
showClue();

//add event listeners
addEventListeners();

//show lvl in ui
displayLevel(); 

//randomize puzzle's position
reset();

//update state
state.prevLevel = state.level;
}


/**
* UI
**/
function setupUI() {
//reset btn
document.getElementsByClassName(selectors.ui.reset)[0].onclick = _=> {
  updateMessage(`RESET`);
  reset();
}
//level up btn
document.getElementsByClassName(selectors.ui.lvlUp)[0].onclick = _=> {
  btnsOnclick(1);
}
//decrease lvl btn
document.getElementsByClassName(selectors.ui.lvlDown)[0].onclick = _=> {
  btnsOnclick(-1);
}
displayLevel(); 
}

function btnsOnclick(modifier) {
let level = state.level + modifier;
if (level < 1 || level > 5 || level > state.topLevel) return;
setLevel(level);
reset();
}

function reset() {

randomFilter();
updateGlobalModifier('animation');
state.timer = dificulty + 3;

puzzles.forEach(puzzle => {
  boardPuzzle.appendChild(puzzle);
  boardPuzzle.style.opacity = 1; 
});
 
composeAnimation(0, 1); //timeout [, opacity = 0 ]
composeAnimation(1000, 1);
composeAnimation(2000, 1);
composeAnimation(3000);

setTimeout(_=>{
  state.timer = dificulty + 1;
  updateGlobalModifier('animation', 'remove');
}, 3000);
}


function displayLevel() {
document.getElementsByClassName(selectors.ui.level)[0].textContent = `LVL ${state.level}`;
}

function timerStart() { 
setInterval(_=> {
  timers.forEach(timer => {
    let size = (100 + 1/dificulty*100)*(1 - state.timer/dificulty);
    if (size >= 100 || state.timer > dificulty) size = 0;
    if (timer.classList.contains(selectors.ui.timerX)) {
      timer.style.width = `${size}%`;
    } else {
      timer.style.height = `${size}%`; 
    }
  });
  if (state.timer > 0) {
    state.timer--; 
  } else {
    updateMessage(`TIMEOUT`);
    reset();
  }
}, 1000);
}

/**
* Building levels
**/
function setDifficultyLevel(level) {
//update boards classnames
updateGlobalModifier(`lvl-${level}`);

//clone cells
cloneElement(selectors.boardRow, selectors.target, level); 
cloneElement(selectors.puzzleRow, selectors.puzzle, level);

//clone rows
cloneElement(selectors.boardTarget, selectors.boardRow, level);
cloneElement(selectors.boardPuzzle, selectors.puzzleRow, level); 

//set time for current lvl
dificulty = Math.pow(state.level, 2)*15; 
}

function showClue() {
let newClue = clue.cloneNode(true);
board.appendChild(newClue);
}

function updateGlobalModifier(modifier, action = 'add') {
if (action === 'add') document.body.classList.add(modifier);
if (action === 'remove') document.body.classList.remove(modifier);
}

function cloneElement(container, element, level) {
let targetContainer = document.getElementsByClassName(container)[0],
    targetElement = document.getElementsByClassName(element)[0]; 

for (let i = 0; i <= level; i++) {
  let newElement = targetElement.cloneNode(true);
  newElement.dataset.index = i;
  targetContainer.appendChild(newElement);
}
}

function updateDataAttributes(elements) {
elements.forEach((element, i) => {
  let data = `${element.parentNode.dataset.index}-${i%(state.level + 1)}`;
  if (element.dataset.target) element.dataset.target = data;
  else element.dataset.puzzle = data;
});
}

function randomizePuzzlesPosition() {
let positions = [], 
    rowLength = Math.sqrt(puzzles.length);
for (let i = 0, iMax = puzzles.length; i < iMax; i++) positions.push(i);
positions = positions.sort(_ => .5 - Math.random()).reverse();
puzzles.forEach((puzzle, index) => {
  puzzle.style.left = `${(100/rowLength)*(positions[index]%rowLength) + 5}%`;
  puzzle.style.top = `${(100/rowLength)*(Math.floor(positions[index]/rowLength))}%`;
});
} 

function clearInnerHtml(elm) {
while (elm.hasChildNodes()) { 
  elm.removeChild(elm.firstChild);
}
}

function setLevel(level) {

updateMessage(`LEVEL ${level}`);
updateGlobalModifier(`lvl-${state.prevLevel}`, 'remove');

clearInnerHtml(board);
clearInnerHtml(boardPuzzle);
clearInnerHtml(modelRowTarget);
clearInnerHtml(modelRowPuzzle);

//update local storage
window.localStorage.setItem('lvl', level);
if (level > state.topLevel) {
  state.topLevel = level;
  window.localStorage.setItem('topLvl', level);
}
  
//set state lvls and reset defaults
state.prevLevel = level;
state.level = level;

//clear data
targets = [];
puzzles = [];
matrix = [];

init();
}

function updateMessage(msg) {
messageBox.textContent = msg;
}

function addNavs() {
 let element = document.getElementsByClassName(selectors.navsElment)[0],
     modifier = `${selectors.navsElment}--side`;

for (let i = 0; i < 360; i+=5) {
  let newElement = element.cloneNode(true),
      content = i == 0 ? `E` : i == 90 ? `N` : i == 180 ? `W` : i == 270 ? `S` : i;
  
  if (i == 0 || i == 90 || i == 180 || i == 270) newElement.classList.add(modifier);
  newElement.textContent = content;
  containerNavs.appendChild(newElement);
}
}

/**
* Pazzle logic
*
* right, bottom => random values (0..4)
* [
*   [ [right, bottom], [right, bottom], ... [right, bottom], [right, bottom] ],
*   ...
*   [ [right, bottom], [right, bottom], ... [right, bottom], [right, bottom] ],
* ]
**/
function randomMatrix() {
let length = Math.sqrt(targets.length);

for (let y = 0; y < length - 1; y++) {
  matrix.push(createMatrixRow(length)); 
}
//pushing last row (no bottom styles)
matrix.push(createMatrixRow(length, true));
}

function createMatrixRow(length, last) {
let row = [];  
for (let x = 0; x < length - 1; x++) { 
    row.push([Math.floor(Math.random()*combinations), last ? 'End' : Math.floor(Math.random()*combinations)]);
}
//pushing last puzzle (no right styles)
row.push(['End', last ? 'End' : Math.floor(Math.random()*combinations)]);
return row;
}

function checkMatchOnDrop(target, puzzleData) {
let checkFailed = puzzles.some(puzzle=>{
  return puzzle.parentNode.dataset.target !== puzzle.dataset.puzzle;
});
if (checkFailed) return;
else setLevel(state.level + 1);
}

/**
* Styling
**/

function stylePuzzles() {
 puzzles.forEach(elm => {
    let data = elm.dataset.puzzle.split('-'), 
    row = data[0],
    cell = data[1],
    decors = elm.children; 
   
    //random modifiers 
    elm.classList.add(`r${matrix[row][cell][0]}`);
    elm.classList.add(`b${matrix[row][cell][1]}`);
    if (cell > 0) elm.classList.add(`l${matrix[row][cell - 1][0]}`);
    if (row > 0) elm.classList.add(`t${matrix[row - 1][cell][1]}`);
   
    //background positions
    let bgHorizontal = (-cell*dimensions.size/(state.level + 1)) + dimensions.unit,
        bgHorizontalPrev = (-(cell - 1)*dimensions.size/(state.level + 1)) + dimensions.unit,
        bgVertical = (-row*dimensions.size/(state.level + 1)) + dimensions.unit,
        bgVerticalPrev = (-(row - 1)*dimensions.size/(state.level + 1)) + dimensions.unit;

      //top
      decors[0].style.backgroundPosition = `${bgHorizontal} ${bgVerticalPrev}`;
      //right
      decors[1].style.backgroundPosition = `${bgHorizontal} ${bgVertical}`;
      //bottom
      decors[2].style.backgroundPosition = `${bgHorizontal} ${bgVertical}`;
      //left
      decors[3].style.backgroundPosition = `${bgHorizontalPrev} ${bgVertical}`;
      //bg
      decors[4].style.backgroundPosition = `${bgHorizontal} ${bgVertical}`;
 });
}

function randomFilter() {
let cyrrentClue = document.getElementsByClassName(selectors.clue)[0],
    firstFilter = `${filters[state.filter]}(${Math.floor(Math.random()*30) + 70}%)`,
    secondFilterIndex = (state.filter === 1 || state.filter > 1) ? 0 : state.filter + 1,
    secondFilter = `${filters[secondFilterIndex]}(${Math.floor(Math.random()*30) + 70}%)`,
    composedFilter = firstFilter + secondFilter; 

[...puzzles, ...circles, cyrrentClue].forEach(puzzle => {  
  puzzle.style.filter = composedFilter;
  puzzle.style.WebkitFilter = composedFilter; 
});

state.filter++;
if (state.filter > 2) state.filter = 0;
}

function animateNavigation(horizontal, opacity = 0, rotate = 0) {
  let currentClue = document.getElementsByClassName(selectors.clue)[0];

  containerNavs.style.transform = `translateX(${horizontal}%)`;
  currentClue.style.opacity = opacity;
  currentClue.style.transform = `rotate(${rotate}deg)`;
}

function composeAnimation(timeout, opacity = 0) {
setTimeout(_=>{
  let randomDeg = Math.floor(Math.random()*100);
  randomizePuzzlesPosition();
  animateNavigation(-randomDeg*.7, opacity, randomDeg*3.6);
}, timeout);
}

/**
* Drag functionality 
**/

function onDrag(elm) {
elm.addEventListener("dragstart", e =>{
  //avoid issues with chrome and pseudo elements area while dragging ¯\_(ツ)_/¯
  elm.style.cssText += "transform: scale(.95)"; 
  setTimeout(_=> {elm.style.cssText += "transform: scale(1)";}, 0);
  
  e.dataTransfer.setData("text", e.target.id);
  e.dataTransfer.setData("puzzle", e.target.dataset.puzzle);
});
}

function onDrop(elm) {
elm.addEventListener("dragover", e => {
    e.preventDefault(); 
});
elm.addEventListener("drop", e => {
  let data = e.dataTransfer.getData("puzzle"),
      puzzle = document.querySelector(`[data-puzzle="${data}"]`);
      
  e.preventDefault();
  
  //do nothing if target already contains puzzle element
  if (!checkDropAreas(e.target)) return;
  
  e.target.appendChild(puzzle);
  
  
  //move navs container
  animateNavigation(-Math.floor(Math.random()*70));
  
  //check if puzzle resolved
  checkMatchOnDrop();
});
}

function addEventListeners() {
puzzles.forEach(puzzle => { 
  onDrag(puzzle);
});
targets.forEach(target => {
  onDrop(target);
});
}

function checkDropAreas(elm) {
if ((elm.classList.contains(selectors.target) && !elm.hasChildNodes())
    || elm.classList.contains(selectors.boardPuzzle)
    || elm.classList.contains(selectors.puzzleRow)) return true;
else return false;
}
