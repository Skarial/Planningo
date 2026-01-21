import { TetribusRender } from "./tetribus.render.js";

export const Tetribus = {
  highScore: 0,
  ROWS: 20,
  COLS: 10,
  INITIAL_SPEED: 1100,
  SPEED_INCREASE: 80,
  FAST_DROP_SPEED: 50,
  pieceBag: [],
  refillBag: function () {
    // créer une copie des pièces
    this.pieceBag = [...this.pieces];

    // mélange Fisher-Yates
    for (let i = this.pieceBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.pieceBag[i], this.pieceBag[j]] = [
        this.pieceBag[j],
        this.pieceBag[i],
      ];
    }
  },

  getNextPiece: function () {
    if (this.pieceBag.length === 0) {
      this.refillBag();
    }
    return this.pieceBag.pop();
  },

  grid: [],
  currentPiece: null,
  score: 0,
  level: 1,
  linesCleared: 0,
  gameOver: false,
  gameLoop: null,
  dropSpeed: 800,
  isFastDropping: false,

  pieces: [
    {
      name: "I",
      color: "#00f0f0",
      shapes: [
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]],
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]],
      ],
    },
    {
      name: "O",
      color: "#f0f000",
      shapes: [
        [
          [1, 1],
          [1, 1],
        ],
        [
          [1, 1],
          [1, 1],
        ],
        [
          [1, 1],
          [1, 1],
        ],
        [
          [1, 1],
          [1, 1],
        ],
      ],
    },
    {
      name: "T",
      color: "#a000f0",
      shapes: [
        [
          [0, 1, 0],
          [1, 1, 1],
        ],
        [
          [1, 0],
          [1, 1],
          [1, 0],
        ],
        [
          [1, 1, 1],
          [0, 1, 0],
        ],
        [
          [0, 1],
          [1, 1],
          [0, 1],
        ],
      ],
    },
    {
      name: "L",
      color: "#f0a000",
      shapes: [
        [
          [0, 0, 1],
          [1, 1, 1],
        ],
        [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
        [
          [1, 1, 1],
          [1, 0, 0],
        ],
        [
          [1, 1],
          [0, 1],
          [0, 1],
        ],
      ],
    },
    {
      name: "J",
      color: "#0000f0",
      shapes: [
        [
          [1, 0, 0],
          [1, 1, 1],
        ],
        [
          [1, 1],
          [1, 0],
          [1, 0],
        ],
        [
          [1, 1, 1],
          [0, 0, 1],
        ],
        [
          [0, 1],
          [0, 1],
          [1, 1],
        ],
      ],
    },
    {
      name: "S",
      color: "#00f000",
      shapes: [
        [
          [0, 1, 1],
          [1, 1, 0],
        ],
        [
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        [
          [0, 1, 1],
          [1, 1, 0],
        ],
        [
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      ],
    },
    {
      name: "Z",
      color: "#f00000",
      shapes: [
        [
          [1, 1, 0],
          [0, 1, 1],
        ],
        [
          [0, 1],
          [1, 1],
          [1, 0],
        ],
        [
          [1, 1, 0],
          [0, 1, 1],
        ],
        [
          [0, 1],
          [1, 1],
          [1, 0],
        ],
      ],
    },
  ],

  init: function () {
    TetribusRender.init("game-canvas");
    this.createGrid();
    this.setupControls();

    this.start();
  },

  createGrid: function () {
    this.grid = [];
    for (let y = 0; y < this.ROWS; y++) {
      this.grid[y] = new Array(this.COLS).fill(0);
    }
  },

  start: function () {
    // 🔹 Charger le meilleur score sauvegardé
    const savedHighScore = localStorage.getItem("tetribus_high_score");
    this.highScore = savedHighScore ? Number(savedHighScore) : 0;
    this.refillBag();
    this.createGrid();
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.gameOver = false;
    this.dropSpeed = this.INITIAL_SPEED;
    this.updateUI();
    document.getElementById("game-over").classList.add("hidden");
    this.spawnPiece();
    this.startGameLoop();
  },

  startGameLoop: function () {
    if (this.gameLoop) clearInterval(this.gameLoop);

    this.gameLoop = setInterval(
      () => {
        if (this.gameOver) return;
        this.moveDown();
      },
      this.isFastDropping ? this.FAST_DROP_SPEED : this.dropSpeed,
    );
  },

  spawnPiece: function () {
    const pieceTemplate = this.getNextPiece();
    const lineNumbers = {
      I: 20,
      O: 21,
      T: 22,
      L: 24,
      J: 25,
      S: 26,
      Z: 30,
    };

    this.currentPiece = {
      x: Math.floor(this.COLS / 2) - 1,
      y: 0,
      rotation: 0,
      shapes: pieceTemplate.shapes,
      color: pieceTemplate.color,
      name: pieceTemplate.name,
      lineNumber: lineNumbers[pieceTemplate.name],
    };

    if (
      this.hasCollision(
        this.currentPiece.x,
        this.currentPiece.y,
        this.currentPiece.rotation,
      )
    ) {
      this.endGame();
    }
    this.render();
  },

  moveDown: function () {
    if (
      this.hasCollision(
        this.currentPiece.x,
        this.currentPiece.y + 1,
        this.currentPiece.rotation,
      )
    ) {
      this.lockPiece();
      this.clearLines();
      this.spawnPiece();
    } else {
      this.currentPiece.y++;
      this.render();
    }
  },

  moveLeft: function () {
    if (
      !this.gameOver &&
      !this.hasCollision(
        this.currentPiece.x - 1,
        this.currentPiece.y,
        this.currentPiece.rotation,
      )
    ) {
      this.currentPiece.x--;
      this.render();
    }
  },

  moveRight: function () {
    if (
      !this.gameOver &&
      !this.hasCollision(
        this.currentPiece.x + 1,
        this.currentPiece.y,
        this.currentPiece.rotation,
      )
    ) {
      this.currentPiece.x++;
      this.render();
    }
  },

  rotate: function () {
    if (this.gameOver) return;
    const newRotation = (this.currentPiece.rotation + 1) % 4;
    if (
      !this.hasCollision(this.currentPiece.x, this.currentPiece.y, newRotation)
    ) {
      this.currentPiece.rotation = newRotation;
      this.render();
    }
  },

  hasCollision: function (x, y, rotation) {
    const shape = this.currentPiece.shapes[rotation];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) return true;
          if (newY >= 0 && this.grid[newY][newX] !== 0) return true;
        }
      }
    }
    return false;
  },

  lockPiece: function () {
    const shape = this.currentPiece.shapes[this.currentPiece.rotation];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = this.currentPiece.x + col;
          const y = this.currentPiece.y + row;
          if (y >= 0 && y < this.ROWS && x >= 0 && x < this.COLS) {
            this.grid[y][x] = {
              color: this.currentPiece.color,
              lineNumber: this.currentPiece.lineNumber,
            };
          }
        }
      }
    }
  },

  clearLines: function () {
    let linesCleared = 0;
    for (let y = this.ROWS - 1; y >= 0; y--) {
      let isLineFull = true;
      for (let x = 0; x < this.COLS; x++) {
        if (!this.grid[y][x]) {
          isLineFull = false;
          break;
        }
      }
      if (isLineFull) {
        this.grid.splice(y, 1);
        this.grid.unshift(new Array(this.COLS).fill(0));
        linesCleared++;
        y++;
      }
    }

    if (linesCleared > 0) {
      this.linesCleared += linesCleared;
      const points = [0, 100, 300, 500, 800];
      this.score += points[linesCleared] * this.level;
      const newLevel = Math.floor(this.linesCleared / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.dropSpeed = Math.max(
          100,
          this.INITIAL_SPEED - (this.level - 1) * this.SPEED_INCREASE,
        );
        this.startGameLoop();
      }
      this.updateUI();
    }
  },

  updateUI: function () {
    document.getElementById("score-value").textContent = this.score;
    document.getElementById("level-value").textContent = this.level;

    const highScoreEl = document.getElementById("high-score-value");
    if (highScoreEl) {
      highScoreEl.textContent = this.highScore;
    }
  },

  endGame: function () {
    this.gameOver = true;
    clearInterval(this.gameLoop);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("tetribus_high_score", String(this.highScore));
    }

    document.getElementById("final-score").textContent = this.score;
    document.getElementById("game-over").classList.remove("hidden");
  },

  startFastDrop: function () {
    if (this.isFastDropping || this.gameOver) return;
    this.isFastDropping = true;
    this.startGameLoop();
  },

  stopFastDrop: function () {
    if (!this.isFastDropping) return;
    this.isFastDropping = false;
    this.startGameLoop();
  },

  setupControls: function () {
    const btnLeft = document.getElementById("btn-left");
    const btnRight = document.getElementById("btn-right");
    const btnRotate = document.getElementById("btn-rotate");
    const restartBtn = document.getElementById("restart-btn");

    let moveInterval = null;

    // Bouton GAUCHE
    btnLeft.addEventListener("touchstart", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      this.moveLeft();
      moveInterval = setInterval(() => this.moveLeft(), 120);
    });

    btnLeft.addEventListener("touchend", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      clearInterval(moveInterval);
    });

    btnLeft.addEventListener("click", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      this.moveLeft();
    });

    // Bouton DROITE
    btnRight.addEventListener("touchstart", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      this.moveRight();
      moveInterval = setInterval(() => this.moveRight(), 120);
    });

    btnRight.addEventListener("touchend", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      clearInterval(moveInterval);
    });

    btnRight.addEventListener("click", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      if (e.target !== btnRight) return;
      this.moveRight();
    });

    // Bouton ROTATION
    let rotateTimeout = null;
    let isLongPress = false;

    btnRotate.addEventListener("touchstart", (e) => {
      e.preventDefault(); // ⛔ bloque click fantôme

      isLongPress = false;

      rotateTimeout = setTimeout(() => {
        isLongPress = true;
        this.startFastDrop();
      }, 300);
    });

    btnRotate.addEventListener("touchend", (e) => {
      e.preventDefault(); // ⛔ bloque click fantôme

      clearTimeout(rotateTimeout);

      if (isLongPress) {
        this.stopFastDrop();
      } else {
        this.rotate();
      }
    });

    // 🔒 sécurité si le doigt quitte le bouton
    btnRotate.addEventListener("touchcancel", () => {
      clearTimeout(rotateTimeout);
      this.stopFastDrop();
    });

    // Bouton RECOMMENCER
    restartBtn.addEventListener("touchend", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      this.start();
    });

    restartBtn.addEventListener("click", (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      this.start();
    });
  },

  render: function () {
    TetribusRender.render(this.grid, this.currentPiece);
  },

  stop: function () {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.isFastDropping = false;
  },
};
