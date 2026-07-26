window.mazeCanvas = {
    _idleTimer: null,

    draw: function (canvasId, dto) {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }

        this._render(canvasId, dto);

        // The player only gets a single "moving" draw per step (Blazor draws once per
        // keypress, there's no continuous animation loop) — settle back to a standing
        // pose shortly after so the walk cycle doesn't freeze mid-stride.
        if (dto.playerMoving) {
            this._idleTimer = setTimeout(() => {
                this._idleTimer = null;
                this._render(canvasId, Object.assign({}, dto, { playerMoving: false }));
            }, 180);
        }
    },

    _render: function (canvasId, dto) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const size = dto.cellSize;
        canvas.width = dto.cols * size + 1;
        canvas.height = dto.rows * size + 1;

        const ctx = canvas.getContext('2d');
        const bg = '#ffffff';
        const wallColor = '#212529';
        const visitedColor = '#e9ecef';
        const currentColor = '#ffe08a';
        const pathColor = '#74c0fc';
        const goalColor = '#40c057';

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // dto.walls / dto.state are flat strings, one hex digit per cell (row-major),
        // instead of an array of per-cell objects — far cheaper to marshal and parse
        // on every animation frame during generation/solving.
        const cols = dto.cols, rows = dto.rows;

        // fill visited / current / path overlays first
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const s = parseInt(dto.state[y * cols + x], 16);
                let fill = null;
                if (s & 2) fill = currentColor;       // current
                else if (s & 4) fill = pathColor;      // in solved path
                else if (s & 1) fill = visitedColor;   // visited
                if (fill) {
                    ctx.fillStyle = fill;
                    ctx.fillRect(x * size, y * size, size, size);
                }
            }
        }

        // goal marker
        ctx.fillStyle = goalColor;
        const gPad = size * 0.2;
        ctx.fillRect(dto.goalX * size + gPad, dto.goalY * size + gPad, size - gPad * 2, size - gPad * 2);

        // walls
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'square';
        ctx.beginPath();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const w = parseInt(dto.walls[y * cols + x], 16);
                const px = x * size;
                const py = y * size;
                if (w & 1) { ctx.moveTo(px, py); ctx.lineTo(px + size, py); } // North
                if (w & 2) { ctx.moveTo(px + size, py); ctx.lineTo(px + size, py + size); } // East
                if (w & 4) { ctx.moveTo(px, py + size); ctx.lineTo(px + size, py + size); } // South
                if (w & 8) { ctx.moveTo(px, py); ctx.lineTo(px, py + size); } // West
            }
        }
        ctx.stroke();

        // player
        this._drawPlayer(
            ctx,
            dto.playerX * size + size / 2,
            dto.playerY * size + size / 2,
            size,
            !!dto.playerMoving,
            !!dto.playerPhase);
    },

    // Simple stick figure: circle head, torso line, arm/leg limbs.
    // Standing: limbs symmetric and close to the body.
    // Walking: limbs swing to opposite sides each step (playerPhase alternates true/false),
    // arms and legs on the same side swing opposite to each other, like a walk cycle.
    _drawPlayer: function (ctx, cx, cy, size, moving, phase) {
        const playerColor = '#e03131';
        const headR = size * 0.14;
        const headY = cy - size * 0.30;
        const neckY = cy - size * 0.16;
        const hipY = cy + size * 0.02;
        const shoulderY = cy - size * 0.12;
        const handY = cy - size * 0.02;
        const footY = cy + size * 0.32;

        const forward = size * 0.22;
        const back = size * 0.06;
        const restLeg = size * 0.10;
        const restHand = size * 0.14;

        // Left/right limbs always stay on their own side (no crossing over the body);
        // only how far each swings out changes. Arm and leg on the same side swing
        // oppositely (contra-lateral stride: left leg forward pairs with right arm forward).
        let leftFootX, rightFootX, leftHandX, rightHandX;
        if (moving && phase) {
            leftFootX = cx - forward;
            rightFootX = cx + back;
            leftHandX = cx - back;
            rightHandX = cx + forward;
        } else if (moving) {
            leftFootX = cx - back;
            rightFootX = cx + forward;
            leftHandX = cx - forward;
            rightHandX = cx + back;
        } else {
            leftFootX = cx - restLeg;
            rightFootX = cx + restLeg;
            leftHandX = cx - restHand;
            rightHandX = cx + restHand;
        }

        ctx.strokeStyle = playerColor;
        ctx.fillStyle = playerColor;
        ctx.lineWidth = Math.max(1.5, size * 0.06);
        ctx.lineCap = 'round';

        // head
        ctx.beginPath();
        ctx.arc(cx, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // torso
        ctx.beginPath();
        ctx.moveTo(cx, neckY);
        ctx.lineTo(cx, hipY);
        ctx.stroke();

        // arms
        ctx.beginPath();
        ctx.moveTo(cx, shoulderY);
        ctx.lineTo(leftHandX, handY);
        ctx.moveTo(cx, shoulderY);
        ctx.lineTo(rightHandX, handY);
        ctx.stroke();

        // legs
        ctx.beginPath();
        ctx.moveTo(cx, hipY);
        ctx.lineTo(leftFootX, footY);
        ctx.moveTo(cx, hipY);
        ctx.lineTo(rightFootX, footY);
        ctx.stroke();
    },

    focus: function (canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas) canvas.focus();
    }
};
