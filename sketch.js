// A2 Group 4B Final Game
// Fog-of-war tile maze (p5.js + p5.sound)
//
// Controls: arrow keys / WASD. After a win or loss, press R to restart.
// The maze is the hand-authored MAZE_LAYOUT grid below (0 = obstacle,
// 1 = path) plus MAZE_START / MAZE_EXIT markers. Food is placed
// automatically in every dead-end (see deadEndCells()).
// All tuning lives in CONFIG. Everything is sized from CONFIG.TILE_SIZE
// and positioned inside CONFIG.FENCE_BOUNDS (the fenced area of the
// background image).

// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
  TILE_SIZE: 48,

  // Canvas size. The background image (2048x1410) is drawn stretched to
  // exactly this size, so FENCE_BOUNDS below are in canvas pixels.
  CANVAS: { width: 1176, height: 810 },

  // Inner edge of the fenced region of the background, in canvas pixels.
  // The maze grid is centered inside this box; nothing game-related is
  // drawn outside it (except the timer and state overlays).
  FENCE_BOUNDS: { left: 78, top: 281, right: 1099, bottom: 810 },

  TIMER_START_SECONDS: 120,

  // Global font — applied to every piece of text the game renders.
  FONT_PATH: "dogica/TTF/dogica.ttf",

  // Splash screen on initial load.
  SPLASH_IMAGE_PATH: "assets/images/splash.png",
  SPLASH_PROMPT_TEXT: "Press SPACE to start",
  SPLASH_PULSE_PERIOD_SECONDS: 1.5,

  // Movement hint in top-left.
  MOVEMENT_HINT_TEXT: "WASD or arrows to navigate",

  // Eating is input-triggered: standing on food shows a small "Press E to
  // eat" hint; pressing E opens the math-question modal. Stepping onto food
  // does nothing on its own, so accidental eating is impossible.
  EAT_KEY: "E",
  EAT_PROMPT_TEXT: "Press E to eat",
  EAT_PROMPT_FADE_SECONDS: 0.2, // hint fades in/out as you step on/off food

  // The modal locks movement (uncancelable) until the typed answer is
  // correct. Wrong answers clear the input and cost only clock time — no
  // fail state. Question choice cycles with the eating-event index, so the
  // nth food of a run always asks the same question across runs.
  MODAL_BACKGROUND_PATH: "assets/images/Question box final.png",
  EATING_MATH_QUESTIONS: [
    { question: "6 x 8 - 12", answer: 36 },
    { question: "9 + 4 x 5", answer: 29 },
    { question: "7 x 6 + 9", answer: 51 },
    { question: "48 / 6 + 13", answer: 21 },
    { question: "5 x 9 - 17", answer: 28 },
    { question: "3 + 7 x 7", answer: 52 },
    { question: "64 / 8 x 3", answer: 24 },
    { question: "12 x 4 - 19", answer: 29 },
    { question: "8 x 7 - 26", answer: 30 },
    { question: "45 / 9 + 28", answer: 33 },
    { question: "6 + 8 x 6", answer: 54 },
    { question: "11 x 3 + 14", answer: 47 },
    { question: "72 / 8 - 3", answer: 6 },
    { question: "4 x 12 - 15", answer: 33 },
    { question: "9 x 6 - 24", answer: 30 },
    { question: "13 + 6 x 4", answer: 37 },
    { question: "56 / 7 + 19", answer: 27 },
    { question: "15 x 3 - 26", answer: 19 },
  ],

  // Eating feedback (visual only — plays once the sequence completes).
  FOOD_VANISH_SECONDS: 0.4, // food scales up ~120% and fades out over this
  EAT_GLOW_SECONDS: 0.5,    // radial glow pulse duration on completion
  EAT_GLOW_PEAK_SCALE: 1.5, // glow diameter at its peak, in tiles
  EAT_GLOW_ALPHA: 0.55,     // glow opacity at the moment of eating

  // The hidden mechanic. Fog creeps back over revealed tiles at
  //   rate = min(FADE_MAX_RATE, FADE_RAMP_PER_SECOND * (timeSinceLastAte - FADE_ONSET_SECONDS))
  // scaled per tile by how long ago it was last walked
  // (age / FADE_AGE_WINDOW_SECONDS, capped at 1) so the oldest trail fades first.
  FADE_ONSET_SECONDS: 8,      // no fading this long after eating (or after start)
  FADE_RAMP_PER_SECOND: 0.020,
  FADE_MAX_RATE: 0.6,         // hard cap on fade speed (alpha/second)
  FADE_AGE_WINDOW_SECONDS: 20,

  PLAYER_SPEED_TILES_PER_SEC: 3.0,
  REVEAL_RADIUS_TILES: 1.6,   // how far around the player tiles reveal

  // Starvation effects. Every effect below reads the same eased copy of the
  // hidden variable, ramps from its own onset up to full strength at
  // EFFECTS_FULL_AT_SECONDS, and recovers simultaneously over
  // EFFECT_RECOVERY_SECONDS when eating resets the variable. Deterministic.
  EFFECTS_FULL_AT_SECONDS: 40,
  EFFECT_RECOVERY_SECONDS: 1,

  // Screen-edge vignette: corners darken as hunger climbs, narrowing the view.
  VIGNETTE_ONSET_SECONDS: 8,
  VIGNETTE_MAX_ALPHA: 0.65,

  // Audio thinning: music gets quieter and muffled (low-pass) while starved.
  AUDIO_THINNING_ONSET_SECONDS: 8,
  MIN_MUSIC_VOLUME: 0.4,      // fraction of normal music volume at peak
  MUSIC_VOLUME: 0.45,

  // Starved movement: the one starvation effect with real mechanical bite.
  STARVATION_SPEED_ONSET_SECONDS: 30,
  MIN_SPEED_MULTIPLIER: 0.8,  // movement speed factor at peak starvation

  // End-of-run reveal: hold on the true final state before any text.
  END_REVEAL_HOLD_SECONDS: 2,
  END_REVEAL_FADE_SECONDS: 0.5,

  // Element scales, all relative to TILE_SIZE.
  PLAYER_SCALE: 0.95,         // sprite fits inside one tile
  FOOD_SCALE: 0.75,

  // Drop shadow under the character. It stays locked to the ground at the
  // true grid position while the sprite wobbles and swells above it, so it
  // doubles as an honest reference for where the player really is.
  // Small and light when fed; large and heavy when starved.
  SHADOW_ALPHA: 0.35,         // center darkness when fed
  SHADOW_MAX_ALPHA: 0.75,     // center darkness at peak starvation
  SHADOW_SIZE: 0.6,           // ellipse width in tiles when fed
  SHADOW_MAX_SCALE: 2.5,      // ellipse width in tiles at peak starvation

  // Stillness-triggered distortion. Driven purely by timeStandingStill —
  // timeSinceLastAte has no influence on it. Subtle: a slow, uneasy
  // breathing rather than an active warp. Purely visual and deterministic —
  // collision and the true position stay locked to TILE_SIZE throughout.
  STILLNESS_DISTORTION_ONSET_SECONDS: 0.5,
  MAX_SPRITE_WARP_PIXELS: 3,    // sine edge displacement at full stillness
  MAX_ASYMMETRIC_SCALE: 0.06,   // +/-6% taller/thinner <-> wider/shorter
  DISTORTION_RESOLVE_SECONDS: 0.4, // ease back to normal after moving

  ANIM: {
    framesPerSecond: 8,
    walkCycle: [0, 1, 0, 2],  // sprite sheet columns cycled while walking
    idleFrame: 0,             // column shown when standing still
  },
  // Character sprite sheet layout: 3 columns of animation frames, 4 rows.
  // The sheet has no left-facing row (rows 2 and 3 both face right), so
  // "left" reuses the right-facing row mirrored with scale(-1, 1).
  SHEET: {
    cols: 3,
    rows: 4,
    facing: {
      down: { row: 0, flip: false },
      up: { row: 1, flip: false },
      right: { row: 2, flip: false },
      left: { row: 2, flip: true },
    },
  },

  ASSETS: {
    background: "assets/images/Game background (web).png",
    characterSheet: "assets/images/Character sprite sheet.png",
    fog: "assets/images/Fog/Fog 2.png",
    food: [
      "assets/images/Food/Food 1 - Bread.png",
      "assets/images/Food/Food 2 - Corn.png",
    ],
    // Path tile art is normalized offline: every image is a square canvas
    // with its corridor exactly centered at half-tile thickness, so any two
    // adjacent path tiles connect seamlessly at any rotation.
    // Source-image orientations (rotations are derived from these):
    //   begin    — dead-end cap, opening faces WEST
    //   end      — exit corridor, opening faces SOUTH
    //   straight — corridor runs WEST-EAST
    //   corner   — openings NORTH + EAST
    //   tee      — openings WEST + EAST + SOUTH
    tiles: {
      begin: "assets/images/Maze path/Path beginning.png",
      end: "assets/images/Maze path/Path end.png",
      straight: "assets/images/Maze path/Path straight.png",
      corner: "assets/images/Maze path/Path right angle.png",
      tee: "assets/images/Maze path/Path T shape.png",
      cross: "assets/images/Maze path/Path intersection.png",
    },
    obstacles: [
      "assets/images/Obstacles/Corn 1.png",
      "assets/images/Obstacles/Corn 2.png",
      "assets/images/Obstacles/Corn 3.png",
      "assets/images/Obstacles/Leaf.png",
    ],
    sounds: {
      music: "assets/sounds/Background music.mp3",
      walk: "assets/sounds/Walking.wav",
      eat: "assets/sounds/Eating.wav",
      victory: "assets/sounds/Victory.wav",
    },
  },

  TEXT: {
    title: "MAZE",
    win: "You made it",
    lose: "Time's up",
    restartKey: "R",
  },
};

// ============================================================
// MAZE — hand-authored. 0 = obstacle, 1 = path.
// Edit freely; tile art (straight / corner / T / dead-end) is chosen
// automatically from each cell's neighbors at load time.
// ============================================================
const MAZE_LAYOUT = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0],
  [0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
  [0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0],
  [0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0],
  [0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0],
  [0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0],
  [0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0],
  [0,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const MAZE_START = { col: 1, row: 1 };
const MAZE_EXIT = { col: 19, row: 9 };
// Food is placed automatically in every dead-end of the maze — a walkable
// cell with only one walkable neighbour — so all food always sits in dead
// ends. The start and exit caps are single-neighbour cells too, but they are
// excluded (they aren't food spots). Editing MAZE_LAYOUT moves the food along
// with the dead-ends, no manual coordinate upkeep required.

// ============================================================
// Internal state
// ============================================================
const img = { tiles: {}, obstacles: [], food: [] };
const snd = {};

let TS, COLS, ROWS;
let mazeOX, mazeOY;      // top-left pixel of the maze grid (inside the fence)
let worldG;              // pre-rendered background + paths + obstacles
let fogG = [];           // pre-rendered fog blobs (4 rotations)
let foodG = [];          // pre-rendered food sprites
let sheetFrames;         // sheetFrames[rowIdx][colIdx] = {sx, sy, sw, sh} source rects

let grid;                // grid[row][col] = { walk }
let foods = [];          // { col, row, kind, eaten }

let fogAlpha, fogTouch, fogSeen; // per-tile fog state

let player;
let state = "splash";    // splash | playing | win | lose
let timeLeft;            // countdown (the only UI element)
let timeSinceLastAte;    // the hidden variable — never displayed
let clock;               // elapsed play time, drives fog aging
let starveSeconds;       // eased copy of timeSinceLastAte: follows it while
                         // climbing, drains over EFFECT_RECOVERY_SECONDS after
                         // eating — the ambient effects read this
let eatingFx;            // { food, elapsed } post-eat feedback window, else null
let eatModal;            // { food, q, typed, elapsed } while the math modal is open
let eatCount;            // eating events completed this run (drives question choice)
let eatPromptAlpha;      // "Press E to eat" hint opacity 0..1 (fades with on/off food)
let musicFilter;         // low-pass filter on the music for audio thinning
let tickOsc, tickEnv;    // soft synth tick for wrong answers
let fontDogica;          // the global game font
let imgSplash;           // splash screen image

let timeStandingStill;   // seconds since the player last moved
let stillLevel;          // displayed stillness-distortion level 0..1
let endRevealT;          // seconds since win/lose — drives the end reveal

// ============================================================
// preload / setup / draw
// ============================================================
function preload() {
  fontDogica = loadFont(CONFIG.FONT_PATH);
  img.modal = loadImage(CONFIG.MODAL_BACKGROUND_PATH);
  img.background = loadImage(CONFIG.ASSETS.background);
  imgSplash = loadImage(CONFIG.SPLASH_IMAGE_PATH);
  img.sheet = loadImage(CONFIG.ASSETS.characterSheet);
  img.fog = loadImage(CONFIG.ASSETS.fog);
  for (const p of CONFIG.ASSETS.food) img.food.push(loadImage(p));
  for (const k in CONFIG.ASSETS.tiles) img.tiles[k] = loadImage(CONFIG.ASSETS.tiles[k]);
  for (const p of CONFIG.ASSETS.obstacles) img.obstacles.push(loadImage(p));

  soundFormats("mp3", "wav");
  snd.music = loadSound(CONFIG.ASSETS.sounds.music);
  snd.walk = loadSound(CONFIG.ASSETS.sounds.walk);
  snd.eat = loadSound(CONFIG.ASSETS.sounds.eat);
  snd.victory = loadSound(CONFIG.ASSETS.sounds.victory);
}

function setup() {
  TS = CONFIG.TILE_SIZE;
  ROWS = MAZE_LAYOUT.length;
  COLS = MAZE_LAYOUT[0].length;
  createCanvas(CONFIG.CANVAS.width, CONFIG.CANVAS.height);

  // Center the maze grid inside the fenced area. Integer origin so every
  // tile lands on exact pixel coordinates and edges meet cleanly.
  const f = CONFIG.FENCE_BOUNDS;
  mazeOX = f.left + floor((f.right - f.left - COLS * TS) / 2);
  mazeOY = f.top + floor((f.bottom - f.top - ROWS * TS) / 2);

  parseMaze();
  buildWorld();

  // Four rotated fog variants, picked per tile, so the overlay doesn't
  // read as an obvious repeating grid. Blobs are 2x tile so soft edges overlap.
  fogG = [0, 90, 180, 270].map((deg) => {
    const g = createGraphics(TS * 2, TS * 2);
    g.push();
    g.translate(TS, TS);
    g.rotate(radians(deg));
    g.image(img.fog, -TS, -TS, TS * 2, TS * 2);
    g.pop();
    return g;
  });

  foodG = img.food.map((f2) => {
    const g = createGraphics(TS, TS);
    const box = TS * CONFIG.FOOD_SCALE;
    let w = box, h = box * (f2.height / f2.width);
    if (h > box) { h = box; w = box * (f2.width / f2.height); }
    g.image(f2, (TS - w) / 2, (TS - h) / 2, w, h);
    return g;
  });

  sheetFrames = measureSheetFrames();

  // Route the music through a low-pass filter so starvation can muffle it.
  musicFilter = new p5.LowPass();
  snd.music.disconnect();
  snd.music.connect(musicFilter);

  snd.music.setVolume(CONFIG.MUSIC_VOLUME);
  snd.walk.setVolume(0.7);
  snd.eat.setVolume(0.9);
  snd.victory.setVolume(0.9);

  textFont(fontDogica); // every text() call in the game uses Dogica

  resetGame();
  state = "splash";
}

function draw() {
  const dt = min(deltaTime / 1000, 0.05);
  
  if (state === "splash") {
    drawSplash();
    return;
  }

  update(dt);
  if (state === "win" || state === "lose") endRevealT += dt;

  image(worldG, 0, 0);
  drawFoods();
  drawEatGlow();
  drawPlayer();
  drawFog();
  drawVignette();
  drawEatPrompt();
  drawEatModal();
  drawMovementHint();
  drawTimer();
  drawOverlays();
  manageWalkSound();
}

// ============================================================
// Update
// ============================================================
function update(dt) {
  if (state !== "playing") return;

  clock += dt;
  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    endGame(false);
    return;
  }

  timeSinceLastAte += dt;
  if (eatingFx) {
    eatingFx.elapsed += dt;
    if (eatingFx.elapsed >= max(CONFIG.FOOD_VANISH_SECONDS, CONFIG.EAT_GLOW_SECONDS)) eatingFx = null;
  }
  if (eatModal) eatModal.elapsed += dt;

  // starveSeconds follows the hidden variable while it climbs; after eating
  // resets it, all effects drain back together over EFFECT_RECOVERY_SECONDS
  // instead of snapping.
  if (timeSinceLastAte >= starveSeconds) starveSeconds = timeSinceLastAte;
  else starveSeconds = max(timeSinceLastAte,
    starveSeconds - (CONFIG.EFFECTS_FULL_AT_SECONDS / CONFIG.EFFECT_RECOVERY_SECONDS) * dt);
  applyAudioThinning();

  // Stillness tracking for the sprite/shadow distortion. Climbs while the
  // player stands still (including during the eating modal), resets the
  // moment they move. The displayed level ramps in past the onset and
  // resolves over DISTORTION_RESOLVE_SECONDS once moving again.
  if (player.moving) timeStandingStill = 0;
  else timeStandingStill += dt;
  const stillTarget = constrain(
    (timeStandingStill - CONFIG.STILLNESS_DISTORTION_ONSET_SECONDS) / 1.0, 0, 1);
  if (stillTarget >= stillLevel) stillLevel = stillTarget;
  else stillLevel = max(stillTarget, stillLevel - dt / CONFIG.DISTORTION_RESOLVE_SECONDS);

  if (!eatModal) handleMovement(dt);
  updatePlayerPixel();
  revealAroundPlayer();
  updateFade(dt);

  // "Press E to eat" hint fades in while standing on uneaten food (and not
  // already in the modal), out otherwise. Stepping off and back on re-shows it.
  const onFood = !eatModal && !player.moving && foodUnderPlayer() !== null;
  const step = dt / CONFIG.EAT_PROMPT_FADE_SECONDS;
  eatPromptAlpha = constrain(eatPromptAlpha + (onFood ? step : -step), 0, 1);
}

// The uneaten food the player is currently standing on, or null.
function foodUnderPlayer() {
  return foods.find((f) => !f.eaten && f.col === player.col && f.row === player.row) || null;
}

function handleMovement(dt) {
  if (!player.moving) {
    const dir = readHeldDirection();
    if (dir) {
      player.facing = dir.name;
      const nc = player.col + dir.dx;
      const nr = player.row + dir.dy;
      if (isWalkable(nc, nr)) {
        player.moving = true;
        player.from = { col: player.col, row: player.row };
        player.to = { col: nc, row: nr };
        player.t = 0;
      }
    }
  }

  if (player.moving) {
    // Severe starvation slows real movement — the one starvation effect
    // with mechanical bite. Recovers with everything else after eating.
    const speedMul = lerp(1, CONFIG.MIN_SPEED_MULTIPLIER,
      starveLevel(CONFIG.STARVATION_SPEED_ONSET_SECONDS));
    player.t += CONFIG.PLAYER_SPEED_TILES_PER_SEC * speedMul * dt;
    player.walkPhase += CONFIG.ANIM.framesPerSecond * dt;
    if (player.t >= 1) {
      player.col = player.to.col;
      player.row = player.to.row;
      player.moving = false;
      player.t = 0;
      onArriveTile();
    }
  }
}

function readHeldDirection() {
  const dirs = [
    { name: "up", dx: 0, dy: -1, held: keyIsDown(UP_ARROW) || keyIsDown(87) },
    { name: "down", dx: 0, dy: 1, held: keyIsDown(DOWN_ARROW) || keyIsDown(83) },
    { name: "left", dx: -1, dy: 0, held: keyIsDown(LEFT_ARROW) || keyIsDown(65) },
    { name: "right", dx: 1, dy: 0, held: keyIsDown(RIGHT_ARROW) || keyIsDown(68) },
  ];
  // Prefer continuing in the current facing so corridors feel smooth.
  dirs.sort((a, b) => (b.name === player.facing) - (a.name === player.facing));
  return dirs.find((d) => d.held) || null;
}

function onArriveTile() {
  // Food is no longer consumed on contact — the player must press EAT_KEY
  // while standing on it (see openEatModal via keyPressed). Arriving on a
  // food tile only surfaces the "Press E to eat" hint.
  if (player.col === MAZE_EXIT.col && player.row === MAZE_EXIT.row) endGame(true);
}

// Opens the math modal for the food under the player. Called only when the
// player presses EAT_KEY while standing on uneaten food.
function openEatModal(food) {
  const pool = CONFIG.EATING_MATH_QUESTIONS;
  eatModal = {
    food,
    q: pool[eatCount % pool.length],
    typed: "",
    elapsed: 0,
  };
  eatPromptAlpha = 0; // hint gives way to the modal
}

function updatePlayerPixel() {
  const cx = player.moving ? lerp(player.from.col, player.to.col, player.t) : player.col;
  const cy = player.moving ? lerp(player.from.row, player.to.row, player.t) : player.row;
  player.px = mazeOX + cx * TS + TS / 2;
  player.py = mazeOY + cy * TS + TS / 2;
}

function revealAroundPlayer() {
  const r = CONFIG.REVEAL_RADIUS_TILES * TS;
  const c0 = max(0, floor((player.px - r - mazeOX) / TS));
  const c1 = min(COLS - 1, floor((player.px + r - mazeOX) / TS));
  const r0 = max(0, floor((player.py - r - mazeOY) / TS));
  const r1 = min(ROWS - 1, floor((player.py + r - mazeOY) / TS));
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const cx = mazeOX + col * TS + TS / 2;
      const cy = mazeOY + row * TS + TS / 2;
      if (dist(cx, cy, player.px, player.py) <= r) {
        fogAlpha[row][col] = 0;
        fogTouch[row][col] = clock;
        fogSeen[row][col] = true;
      }
    }
  }
}

function updateFade(dt) {
  const past = timeSinceLastAte - CONFIG.FADE_ONSET_SECONDS;
  if (past <= 0) return;
  const baseRate = min(CONFIG.FADE_MAX_RATE, CONFIG.FADE_RAMP_PER_SECOND * past);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!fogSeen[row][col] || fogAlpha[row][col] >= 1) continue;
      const age = clock - fogTouch[row][col];
      if (age <= 0) continue;
      const oldness = min(1, age / CONFIG.FADE_AGE_WINDOW_SECONDS);
      fogAlpha[row][col] = min(1, fogAlpha[row][col] + baseRate * oldness * dt);
    }
  }
}

// How far a starvation effect with the given onset has ramped (0..1),
// reading the eased starveSeconds so eating recovers everything together.
function starveLevel(onsetSeconds) {
  return constrain(
    (starveSeconds - onsetSeconds) / (CONFIG.EFFECTS_FULL_AT_SECONDS - onsetSeconds), 0, 1);
}

// Music thins out as starvation climbs: quieter and low-pass muffled.
function applyAudioThinning() {
  if (!snd.music.isLoaded() || !musicFilter) return;
  const lvl = starveLevel(CONFIG.AUDIO_THINNING_ONSET_SECONDS);
  snd.music.setVolume(CONFIG.MUSIC_VOLUME * lerp(1, CONFIG.MIN_MUSIC_VOLUME, lvl));
  // Exponential sweep 16kHz (open) -> ~800Hz (distant and muffled).
  musicFilter.freq(16000 * pow(800 / 16000, lvl));
}

function endGame(won) {
  state = won ? "win" : "lose";
  endRevealT = 0; // start the hold on the true final state
  snd.walk.stop();
  snd.music.stop();
  if (won) snd.victory.play();
}

// ============================================================
// Rendering
// ============================================================
function tilePx(col, row) {
  return { x: mazeOX + col * TS, y: mazeOY + row * TS };
}

function drawFoods() {
  for (const f of foods) {
    if (f.eaten) continue;
    const p = tilePx(f.col, f.row);
    image(foodG[f.kind], p.x, p.y);
  }

  // The food just eaten doesn't vanish instantly: it scales up ~120% and
  // fades out over the first moments of the pause, tied to the eat sound.
  if (eatingFx && eatingFx.elapsed < CONFIG.FOOD_VANISH_SECONDS) {
    const k = eatingFx.elapsed / CONFIG.FOOD_VANISH_SECONDS;
    const size = TS * (1 + 0.2 * k);
    const p = tilePx(eatingFx.food.col, eatingFx.food.row);
    const ctx = drawingContext;
    ctx.globalAlpha = 1 - k;
    image(foodG[eatingFx.food.kind], p.x + (TS - size) / 2, p.y + (TS - size) / 2, size, size);
    ctx.globalAlpha = 1;
  }
}

// Soft warm radial pulse on the character at the moment of eating —
// "something good just happened here", wordlessly.
function drawEatGlow() {
  if (!eatingFx || eatingFx.elapsed >= CONFIG.EAT_GLOW_SECONDS) return;
  const k = eatingFx.elapsed / CONFIG.EAT_GLOW_SECONDS;
  const radius = (TS * lerp(0.5, CONFIG.EAT_GLOW_PEAK_SCALE, k)) / 2;
  const alpha = CONFIG.EAT_GLOW_ALPHA * (1 - k);
  const ctx = drawingContext;
  const grad = ctx.createRadialGradient(player.px, player.py, 0, player.px, player.py, radius);
  grad.addColorStop(0, `rgba(255, 244, 195, ${alpha})`);
  grad.addColorStop(1, "rgba(255, 244, 195, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.px, player.py, radius, 0, TWO_PI);
  ctx.fill();
}

function drawPlayer() {
  // While the eating modal is open: face down toward the food (the sheet
  // has no eating row) with a small chewing bob. Otherwise idle keeps the
  // last facing and walking cycles frames on the facing's row.
  const eating = eatModal !== null;
  const face = eating ? CONFIG.SHEET.facing.down : CONFIG.SHEET.facing[player.facing];
  const walking = !eating && player.moving;
  const col = walking
    ? CONFIG.ANIM.walkCycle[floor(player.walkPhase) % CONFIG.ANIM.walkCycle.length]
    : CONFIG.ANIM.idleFrame;
  const f = sheetFrames[face.row][col];
  const chewBob = eating ? 1.5 * sin(TWO_PI * 2 * eatModal.elapsed) : 0;

  // Stillness distortion (visual only — collision and true position stay
  // locked to the grid): a slow, uneasy breathing. Deterministic functions
  // of timeStandingStill alone — hunger has no influence here.
  const t = timeStandingStill;
  const asym = CONFIG.MAX_ASYMMETRIC_SCALE * stillLevel * sin(TWO_PI * 0.2 * t);
  const sizeFluct = 1 + 0.06 * stillLevel * sin(TWO_PI * 0.12 * t + 1.3); // +/-6%
  const warpAmp = CONFIG.MAX_SPRITE_WARP_PIXELS * stillLevel;
  const scaleX = sizeFluct * (1 - asym);
  const scaleY = sizeFluct * (1 + asym);

  const box = TS * CONFIG.PLAYER_SCALE;
  let dw = box, dh = box * (f.sh / f.sw);
  if (dh > box) { dh = box; dw = box * (f.sw / f.sh); }

  // Ground shadow first, so the sprite draws on top of it. Ambient size and
  // darkness follow the eased hunger level (small/light fed, large/dark
  // starved); stillness adds rippling, asymmetric pulsing on top.
  const ambient = starveLevel(CONFIG.FADE_ONSET_SECONDS);
  const shadowW = TS * lerp(CONFIG.SHADOW_SIZE, CONFIG.SHADOW_MAX_SCALE, ambient)
    * (1 + 0.1 * stillLevel * sin(TWO_PI * 0.25 * t + 0.6));
  const shadowA = lerp(CONFIG.SHADOW_ALPHA, CONFIG.SHADOW_MAX_ALPHA, ambient);
  const squash = 0.38 * (1 + 0.1 * stillLevel * sin(TWO_PI * 0.18 * t + 2.1));
  const footY = player.py + (TS * CONFIG.PLAYER_SCALE) / 2 - 3;
  const ctx = drawingContext;
  ctx.save();
  ctx.translate(player.px, footY);
  ctx.scale(1, squash);
  const lobe = (ox, w, a) => {
    const g = ctx.createRadialGradient(ox, 0, 0, ox, 0, w / 2);
    g.addColorStop(0, `rgba(15, 10, 0, ${a})`);
    g.addColorStop(0.65, `rgba(15, 10, 0, ${a * 0.7})`);
    g.addColorStop(1, "rgba(15, 10, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ox, 0, w / 2, 0, 2 * Math.PI);
    ctx.fill();
  };
  lobe(0, shadowW, shadowA);
  if (stillLevel > 0.01) {
    // faint side lobes gently ripple the shadow's edge while standing still
    lobe(shadowW * 0.1 * sin(TWO_PI * 0.35 * t), shadowW * 0.55, shadowA * 0.2 * stillLevel);
    lobe(-shadowW * 0.12 * sin(TWO_PI * 0.28 * t + 1.1), shadowW * 0.45, shadowA * 0.18 * stillLevel);
  }
  ctx.restore();

  push();
  translate(player.px, player.py + chewBob);
  scale((face.flip ? -1 : 1) * scaleX, scaleY); // mirror for the missing left row
  if (warpAmp < 0.5) {
    image(img.sheet, -dw / 2, -dh / 2, dw, dh, f.sx, f.sy, f.sw, f.sh);
  } else {
    // Horizontal slices with sine offsets: the outline visibly warps.
    const SLICES = 8;
    for (let i = 0; i < SLICES; i++) {
      const xo = warpAmp * sin(TWO_PI * 1.1 * t + i * 0.85);
      image(img.sheet,
        -dw / 2 + xo, -dh / 2 + (i * dh) / SLICES, dw, dh / SLICES + 0.6,
        f.sx, f.sy + (i * f.sh) / SLICES, f.sw, f.sh / SLICES);
    }
  }
  pop();
}

// A correct answer resolves here: only now does eating actually happen.
function resolveEat() {
  const food = eatModal.food;
  food.eaten = true;
  eatCount++;
  timeSinceLastAte = 0; // the reset — already-faded tiles stay faded
  eatingFx = { food, elapsed: 0 };
  snd.eat.play();
  eatModal = null;
}

// Soft neutral synth tick for a wrong answer (no asset needed).
function playErrorTick() {
  if (!tickOsc) {
    tickOsc = new p5.Oscillator("triangle");
    tickOsc.amp(0);
    tickOsc.start();
    tickEnv = new p5.Envelope();
    tickEnv.setADSR(0.002, 0.09, 0, 0.05);
    tickEnv.setRange(0.1, 0);
  }
  tickOsc.freq(240);
  tickEnv.play(tickOsc);
}

// The "Press E to eat" hint — the game's one instructional line, shown only
// while standing on food (the mechanic is otherwise invisible). Small,
// neutral, low weight: a hint, not a demand. Fades with eatPromptAlpha.
function drawEatPrompt() {
  if (eatPromptAlpha <= 0.01 || eatModal) return;
  const a = eatPromptAlpha;
  const y = max(mazeOY + 10, player.py - TS * 0.95);
  textAlign(CENTER, CENTER);
  textSize(11);
  fill(20, 12, 6, 150 * a);
  text(CONFIG.EAT_PROMPT_TEXT, player.px + 1, y + 1);
  fill(240, 236, 225, 220 * a);
  text(CONFIG.EAT_PROMPT_TEXT, player.px, y);
}

// The eating modal: question box art centered on the canvas, one math
// question, and the digits typed so far. It never covers the top-left
// timer. Uncancelable — answer to continue.
function drawEatModal() {
  if (!eatModal) return;
  const mw = 470;
  const mh = mw * (img.modal.height / img.modal.width);
  const mx = width / 2 - mw / 2;
  const my = height / 2 - mh / 2;
  image(img.modal, mx, my, mw, mh);

  textAlign(CENTER, CENTER);
  textSize(24);
  fill(30, 16, 8, 160);
  text(eatModal.q.question, width / 2 + 2, my + mh * 0.38 + 2);
  fill(255, 240, 214);
  text(eatModal.q.question, width / 2, my + mh * 0.38);

  // Typed answer (blinking caret while empty-ish input is possible).
  const caret = floor(eatModal.elapsed * 2) % 2 === 0 ? "_" : " ";
  const typedLabel = eatModal.typed + caret;
  textSize(28);
  fill(30, 16, 8, 160);
  text(typedLabel, width / 2 + 2, my + mh * 0.62 + 2);
  fill(255, 252, 235);
  text(typedLabel, width / 2, my + mh * 0.62);
}

function drawFog() {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(mazeOX, mazeOY, COLS * TS, ROWS * TS);
  ctx.clip(); // fog stays inside the maze; fence and background remain clear
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const a = fogAlpha[row][col];
      if (a <= 0.01) continue;
      ctx.globalAlpha = min(1, a);
      const p = tilePx(col, row);
      image(fogG[(col * 13 + row * 7) % 4], p.x - TS / 2, p.y - TS / 2);
    }
  }
  ctx.restore();
}

// Screen-edge vignette: the corners darken as starvation climbs, narrowing
// the usable view. Fades back with everything else after eating.
function drawVignette() {
  const a = CONFIG.VIGNETTE_MAX_ALPHA * starveLevel(CONFIG.VIGNETTE_ONSET_SECONDS);
  if (a <= 0.005) return;
  const ctx = drawingContext;
  const r = Math.hypot(width, height) / 2;
  const grad = ctx.createRadialGradient(width / 2, height / 2, r * 0.35, width / 2, height / 2, r);
  grad.addColorStop(0, "rgba(10, 6, 0, 0)");
  grad.addColorStop(0.6, `rgba(10, 6, 0, ${a * 0.55})`);
  grad.addColorStop(1, `rgba(10, 6, 0, ${a})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawTimer() {
  const t = max(0, timeLeft);
  const label = floor(t / 60) + ":" + nf(floor(t % 60), 2);

  // While the eating modal is open, the timer gently pulses warm — the
  // player watches the seconds tick away in exchange for the recovery.
  let size = 36;
  let col = color(255);
  if (eatModal) {
    const pulse = 0.5 + 0.5 * sin(TWO_PI * 2 * eatModal.elapsed);
    size = 36 + 3 * pulse;
    col = lerpColor(color(255), color(255, 224, 140), 0.35 + 0.4 * pulse);
  }

  textSize(size);
  textAlign(RIGHT, TOP);
  fill(0, 190);
  text(label, width - 20 + 2, 20 + 2);
  fill(col);
  text(label, width - 20, 20);
}

function drawMovementHint() {
  textAlign(LEFT, TOP);
  textSize(24); // ~60-70% of timer size (36)
  fill(200, 200, 200, 180); // soft gray, muted
  text(CONFIG.MOVEMENT_HINT_TEXT, 20, 20);
}

function drawSplash() {
  // Display splash image scaled to fit canvas while preserving aspect ratio
  const imgAspect = imgSplash.width / imgSplash.height;
  const canvasAspect = width / height;
  let displayWidth, displayHeight;
  
  if (imgAspect > canvasAspect) {
    // Image is wider; fit to height
    displayHeight = height;
    displayWidth = height * imgAspect;
  } else {
    // Image is taller; fit to width
    displayWidth = width;
    displayHeight = width / imgAspect;
  }
  
  const offsetX = (width - displayWidth) / 2;
  const offsetY = (height - displayHeight) / 2;
  image(imgSplash, offsetX, offsetY, displayWidth, displayHeight);
}

function drawOverlays() {
  if (state === "playing" || state === "splash") return;

  textAlign(CENTER, CENTER);

  // End-of-run reveal: hold on the true final state — trail fade, shadow,
  // number, everything exactly as it is — before any text appears.
  const a = constrain(
    (endRevealT - CONFIG.END_REVEAL_HOLD_SECONDS) / CONFIG.END_REVEAL_FADE_SECONDS, 0, 1);
  if (a <= 0) return;
  fill(0, 170 * a);
  rect(0, 0, width, height);
  fill(255, 255 * a);
  textSize(54);
  text(state === "win" ? CONFIG.TEXT.win : CONFIG.TEXT.lose, width / 2, height / 2 - 20);
  fill(255, 130 * a);
  textSize(24);
  text(CONFIG.TEXT.restartKey, width / 2, height / 2 + 46);
}

function manageWalkSound() {
  if (!snd.walk.isLoaded()) return;
  const shouldPlay = state === "playing" && player.moving && !eatModal;
  if (shouldPlay && !snd.walk.isPlaying()) snd.walk.loop();
  if (!shouldPlay && snd.walk.isPlaying()) snd.walk.stop();
}

// ============================================================
// Input
// ============================================================
function keyPressed() {
  if (state === "splash") {
    // Only SPACE dismisses the splash
    if (keyCode === 32) { // SPACE
      userStartAudio();
      if (snd.music.isLoaded() && !snd.music.isPlaying()) snd.music.loop();
      state = "playing";
      return false;
    }
    // All other keys are inert during splash
    return false;
  }

  // Eating modal input: number keys type, backspace deletes, enter submits.
  // A wrong answer clears the input and plays a soft error tick — no fail
  // state, just more clock spent. The modal cannot be canceled.
  if (state === "playing" && eatModal) {
    if (key >= "0" && key <= "9" && key.length === 1) {
      if (eatModal.typed.length < 4) eatModal.typed += key;
      return false;
    }
    if (keyCode === BACKSPACE) {
      eatModal.typed = eatModal.typed.slice(0, -1);
      return false;
    }
    if (keyCode === ENTER || keyCode === RETURN) {
      if (eatModal.typed.length > 0 && parseInt(eatModal.typed, 10) === eatModal.q.answer) {
        resolveEat();
      } else {
        eatModal.typed = "";
        playErrorTick();
      }
      return false;
    }
    return false; // swallow everything else while the modal is open
  }

  // Press EAT_KEY while standing on food to open the modal. Does nothing if
  // not on food. Ignored mid-step so the tile under the player is settled.
  if (state === "playing" && !eatModal && key.toUpperCase() === CONFIG.EAT_KEY) {
    if (!player.moving) {
      const food = foodUnderPlayer();
      if (food) openEatModal(food);
    }
    return false;
  }

  if ((state === "win" || state === "lose") && (key === "r" || key === "R")) {
    resetGame();
    state = "playing";
    if (snd.music.isLoaded() && !snd.music.isPlaying()) snd.music.loop();
    return false;
  }

  // Keep arrows/space from scrolling the page.
  const gameKeys = [UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, 32, 65, 68, 82, 83, 87];
  if (gameKeys.includes(keyCode)) return false;
}

// ============================================================
// World construction
// ============================================================
function parseMaze() {
  grid = [];
  for (let row = 0; row < ROWS; row++) {
    grid.push([]);
    for (let col = 0; col < COLS; col++) {
      grid[row].push({ walk: MAZE_LAYOUT[row][col] === 1 });
    }
  }
  if (!isWalkable(MAZE_START.col, MAZE_START.row)) throw new Error("MAZE_START is not on a path cell");
  if (!isWalkable(MAZE_EXIT.col, MAZE_EXIT.row)) throw new Error("MAZE_EXIT is not on a path cell");

  foods = deadEndCells().map((f, i) => ({
    col: f.col, row: f.row, kind: i % img.food.length, eaten: false,
  }));
}

function isWalkable(col, row) {
  return col >= 0 && row >= 0 && col < COLS && row < ROWS && grid[row][col].walk;
}

// Every dead-end path cell — walkable with exactly one walkable neighbour —
// excluding the start and exit (which are also single-neighbour caps but are
// not food spots). This guarantees all food lives in dead ends.
function deadEndCells() {
  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!isWalkable(col, row)) continue;
      const neighbours =
        isWalkable(col, row - 1) + isWalkable(col + 1, row) +
        isWalkable(col, row + 1) + isWalkable(col - 1, row);
      if (neighbours > 1) continue;
      if (col === MAZE_START.col && row === MAZE_START.row) continue;
      if (col === MAZE_EXIT.col && row === MAZE_EXIT.row) continue;
      cells.push({ col, row });
    }
  }
  return cells;
}

// Pre-render background, path tiles, and obstacles once — the source art is
// far larger than the tiles, so scaling every frame would be too slow.
function buildWorld() {
  worldG = createGraphics(width, height);
  worldG.image(img.background, 0, 0, width, height);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].walk) {
        const { key, rot } = tileSpriteFor(col, row);
        drawTileInto(worldG, key, col, row, rot);
      } else {
        drawObstacleInto(worldG, col, row);
      }
    }
  }
}

// Pick the path sprite + rotation from which neighbours are walkable:
// 1 neighbor = dead-end cap, 2 opposite = straight, 2 perpendicular = corner,
// 3 = T junction, 4 = intersection. Start/exit use their dedicated art.
function tileSpriteFor(col, row) {
  const n = isWalkable(col, row - 1);
  const e = isWalkable(col + 1, row);
  const s = isWalkable(col, row + 1);
  const w = isWalkable(col - 1, row);
  const count = n + e + s + w;

  // Opening angles, clockwise: E=0, S=90, W=180, N=270.
  const openAngle = e ? 0 : s ? 90 : w ? 180 : 270;

  const isStart = col === MAZE_START.col && row === MAZE_START.row;
  const isExit = col === MAZE_EXIT.col && row === MAZE_EXIT.row;
  if (isStart) return { key: "begin", rot: openAngle - 180 };            // begin opens W
  if (isExit) return { key: "end", rot: openAngle - 90 };                // end opens S

  if (count <= 1) return { key: "begin", rot: openAngle - 180 };         // dead-end cap
  if (count === 4) return { key: "cross", rot: 0 };

  if (count === 2) {
    if (e && w) return { key: "straight", rot: 0 };
    if (n && s) return { key: "straight", rot: 90 };
    // Corner opens N+E; rotating clockwise maps N->E->S->W.
    if (n && e) return { key: "corner", rot: 0 };
    if (e && s) return { key: "corner", rot: 90 };
    if (s && w) return { key: "corner", rot: 180 };
    return { key: "corner", rot: 270 };                                  // w && n
  }

  // Three-way: tee opens W+E+S (missing N).
  if (!n) return { key: "tee", rot: 0 };
  if (!e) return { key: "tee", rot: 90 };
  if (!s) return { key: "tee", rot: 180 };
  return { key: "tee", rot: 270 };                                       // !w
}

function drawTileInto(g, key, col, row, rotDeg) {
  // Exact grid placement; drawn 1px oversized so adjacent tiles can't show
  // a seam. The art itself is normalized (corridors centered, half-tile
  // thick on a square canvas), so every rotation connects cleanly.
  const p = tilePx(col, row);
  const s = TS + 1;
  g.push();
  g.translate(p.x + TS / 2, p.y + TS / 2);
  g.rotate(radians(rotDeg));
  g.image(img.tiles[key], -s / 2, -s / 2, s, s);
  g.pop();
}

// Deterministic obstacle variety: the same cell always gets the same sprite.
function drawObstacleInto(g, col, row) {
  const roll = (col * 31 + row * 17) % 10;
  const idx = roll < 3 ? 0 : roll < 6 ? 1 : roll < 9 ? 2 : 3; // leaf is rarer
  const flip = (col * 7 + row * 13) % 2 === 0;
  const p = tilePx(col, row);

  g.push();
  g.translate(p.x + TS / 2, p.y + TS / 2);
  if (flip) g.scale(-1, 1);
  g.image(img.obstacles[idx], -TS / 2, -TS / 2, TS, TS);
  g.pop();
}

// The sheet is a uniform grid (each character tightly cropped, centered,
// and bottom-aligned in its cell), so frames slice at exact cell bounds.
function measureSheetFrames() {
  const fw = img.sheet.width / CONFIG.SHEET.cols;
  const fh = img.sheet.height / CONFIG.SHEET.rows;
  const frames = [];
  for (let r = 0; r < CONFIG.SHEET.rows; r++) {
    frames.push([]);
    for (let c = 0; c < CONFIG.SHEET.cols; c++) {
      frames[r].push({ sx: c * fw, sy: r * fh, sw: fw, sh: fh });
    }
  }
  return frames;
}

// ============================================================
// Reset — fog, food, timer, hidden variable, player
// ============================================================
function resetGame() {
  timeLeft = CONFIG.TIMER_START_SECONDS;
  timeSinceLastAte = 0;
  clock = 0;
  starveSeconds = 0;
  eatingFx = null;
  eatModal = null;
  eatCount = 0;
  eatPromptAlpha = 0;
  timeStandingStill = 0;
  stillLevel = 0;
  endRevealT = 0;
  if (snd.music && snd.music.isLoaded()) snd.music.setVolume(CONFIG.MUSIC_VOLUME);
  if (musicFilter) musicFilter.freq(16000);

  for (const f of foods) f.eaten = false;

  fogAlpha = [];
  fogTouch = [];
  fogSeen = [];
  for (let row = 0; row < ROWS; row++) {
    fogAlpha.push(new Array(COLS).fill(1));
    fogTouch.push(new Array(COLS).fill(0));
    fogSeen.push(new Array(COLS).fill(false));
  }

  player = {
    col: MAZE_START.col,
    row: MAZE_START.row,
    from: { col: MAZE_START.col, row: MAZE_START.row },
    to: { col: MAZE_START.col, row: MAZE_START.row },
    t: 0,
    moving: false,
    facing: "down",
    walkPhase: 0,
    px: 0,
    py: 0,
  };
  updatePlayerPixel();
}
