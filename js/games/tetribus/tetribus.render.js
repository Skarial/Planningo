export const TetribusRender = {
  canvas: null,
  ctx: null,
  cellSize: 0,

  init: function (canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },

  resize: function () {
    const wrapper = document.getElementById("canvas-wrapper");
    const availableWidth = wrapper.clientWidth;
    const availableHeight = wrapper.clientHeight;

    const cellSizeByWidth = Math.floor(availableWidth / 10);
    const cellSizeByHeight = Math.floor(availableHeight / 20);
    this.cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);

    this.canvas.width = this.cellSize * 10;
    this.canvas.height = this.cellSize * 20;
  },

  clear: function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  drawGrid: function (grid) {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];

        // Case vide
        if (cell === 0) continue;

        const color = cell.color;
        const lineNumber = cell.lineNumber;

        // Sécurité : cellule mal formée
        if (!color) continue;

        const hasLeft =
          x > 0 && grid[y][x - 1] !== 0 && grid[y][x - 1].color === color;

        const hasRight =
          x < grid[y].length - 1 &&
          grid[y][x + 1] !== 0 &&
          grid[y][x + 1].color === color;

        this.drawCell(x, y, color, hasLeft, hasRight, lineNumber);
      }
    }
  },

  drawPiece: function (piece) {
    const shape = piece.shapes[piece.rotation];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const hasLeft = shape[y][x - 1];
          const hasRight = shape[y][x + 1];

          this.drawCell(
            piece.x + x,
            piece.y + y,
            piece.color,
            hasLeft,
            hasRight,
            piece.lineNumber,
          );
        }
      }
    }
  },

  drawCell: function (x, y, color, hasLeft, hasRight, lineNumber) {
    const ctx = this.ctx;
    const s = this.cellSize;
    const px = x * s;
    const py = y * s;

    // ======================
    // CARROSSERIE
    // ======================
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 3, s - 2, s - 6);

    // Bande sous vitres
    ctx.fillStyle = "#111";
    ctx.fillRect(px + 1, py + Math.floor(s * 0.55), s - 2, 2);

    // Châssis
    ctx.fillRect(px + 1, py + s - 5, s - 2, 4);

    // ======================
    // AVANT DU BUS
    // ======================
    if (!hasLeft && hasRight) {
      // Pare-brise
      ctx.fillStyle = "rgba(190,230,255,0.9)";
      ctx.fillRect(px + 3, py + 5, Math.floor(s * 0.55), Math.floor(s * 0.4));

      // Numéro de ligne
      if (lineNumber !== undefined) {
        const textX = px + Math.floor(s * 0.35);
        const textY = py + Math.floor(s * 0.18);

        ctx.font = `${Math.floor(s * 0.35)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Contour (épaisseur)
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#7a5c00"; // jaune foncé / ocre
        ctx.strokeText(lineNumber, textX, textY);

        // Remplissage
        ctx.fillStyle = "#ffd700"; // jaune
        ctx.fillText(lineNumber, textX, textY);
      }

      // Phare
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(px + s - 6, py + s - 9, 3, 3);
    }

    // ======================
    // MILIEU DU BUS
    // ======================
    if (hasLeft && hasRight) {
      // Fenêtres
      ctx.fillStyle = "rgba(200,220,255,0.6)";
      ctx.fillRect(px + 3, py + 5, s - 6, Math.floor(s * 0.28));

      // Portes
      ctx.fillStyle = "rgba(20,20,20,0.7)";
      ctx.fillRect(px + Math.floor(s * 0.45), py + 6, 3, Math.floor(s * 0.45));
      ctx.fillRect(px + Math.floor(s * 0.55), py + 6, 3, Math.floor(s * 0.45));
    }

    // ======================
    // ARRIÈRE DU BUS
    // ======================
    if (hasLeft && !hasRight) {
      ctx.fillStyle = "#ff3333";
      ctx.fillRect(px + 4, py + s - 10, 4, 4);
      ctx.fillRect(px + 10, py + s - 10, 4, 4);
    }

    // ======================
    // ROUES
    // ======================
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(px + s * 0.25, py + s - 2, s * 0.12, 0, Math.PI * 2);
    ctx.arc(px + s * 0.75, py + s - 2, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  },
  render: function (grid, piece) {
    this.clear();
    this.drawGrid(grid);
    if (piece) {
      this.drawPiece(piece);
    }
  },
};
