In this readme I am going to give you the prompt to build the game for us. please use pygame and python to build this game. start by setting up the git environment for this game. you can find the git root at https://github.com/fusioncomputing/flappydragongame.git consider that our venv needs to be setup from scratch.. 



GOAL

A Flappy-Bird-style browser game where the player controls a dragon that flaps to stay aloft, weaves through castle pillars, and can press F to shoot a fireball that destroys incoming meteors. One hit to the dragon ends the run. Includes a start screen and a game-over screen with Play Again and Leave.



TARGET PLATFORM AND TECH



Platform: Web (desktop and mobile browsers).



Tech: HTML5 Canvas + vanilla JavaScript (no frameworks).



Files: index.html, styles.css, game.js.



Orientation: Portrait.



Base virtual resolution: 480 x 800 (scale to fit, letterbox as needed).



GAME STATES



BOOT: Preload assets, then goto MENU.



MENU (Start Screen): Title, Start button, Controls tooltip, Mute toggle.



PLAY: Main gameplay loop.



PAUSE: Optional; toggled with P; dim screen and show Resume.



GAME\_OVER: Show score, best score, buttons \[Play Again] and \[Leave].



Play Again -> reset to PLAY.



Leave -> return to MENU. (If you prefer, link to a URL.)



CONTROLS



Desktop:



Space or Up Arrow: Flap.



F: Shoot fireball.



P: Pause/Resume.



Mouse/touch click: Flap if clicked/tapped on playfield; on-screen Fire button for touch.



Mobile:



Tap anywhere: Flap.



On-screen Fire button (bottom-right): Shoot.



Optional on-screen Pause in top-right.



ENTITIES



Dragon (player)



Position: x fixed near left third (e.g., x = 120), y dynamic.



Physics: gravity + flap impulse; clamp vertical speed.



Hitbox: circle (radius 22 px) centered slightly forward of sprite center for fair collisions.



Animation: flap cycle (optional); simple rotation based on vertical velocity (tilt up/down).



Lives: 1 (any collision ends run).



PillarPair (obstacle)



Two pillars: top and bottom with a vertical gap.



Scrolls left at pillarSpeed.



Width: 90 px.



Gap: dynamic (see Difficulty).



X spacing between pairs: min 280 px with jitter.



Hitbox: axis-aligned rectangles (match art bounds minus a small inset for fairness).



Meteor (enemy projectile)



Spawns from right, moving left toward player lane at meteorSpeed.



Random Y within safe vertical bounds (avoid guaranteed impossible setups).



Hitbox: circle (radius 14 px).



On hit by fireball: destroy meteor, play small explosion sfx, add small score bonus (optional).



Fireball (player projectile)



Shoots from dragon’s mouth position.



Moves right at fireballSpeed.



Hitbox: circle (radius 10 px).



Cooldown: fireCooldown between shots.



Lifetime cap (e.g., 2.0 s) or despawn when offscreen.



Scenery



Parallax background layers (sky, far mountains, near mountains).



Ground strip at bottom (colliding floor).



Particles for flap puff and explosion (optional).



PHYSICS AND GAMEPLAY CONSTANTS (tweakable)



virtualWidth = 480, virtualHeight = 800



gravity = 1800 px/s^2



flapImpulseVy = -520 px/s



maxFallSpeed = 900 px/s



pillarSpeed = 180 px/s (increase with difficulty)



pillarWidth = 90 px



gapStart = 220 px, gapMin = 150 px



pillarMinY = 120 px (top pillar bottom edge)



pillarMaxY = 680 px (bottom pillar top edge)



pillarSpacingXMin = 280 px, pillarSpacingXMax = 360 px



meteorSpeedRange = \[260, 340] px/s



meteorSpawnIntervalStart = 2.5 s, min 1.2 s



fireballSpeed = 520 px/s



fireCooldown = 0.30 s



fireballLifetime = 2.0 s



dragonHitRadius = 22 px



meteorHitRadius = 14 px



fireballHitRadius = 10 px



groundY = 720 px (anything below is ground collision)



SPAWNING AND DIFFICULTY CURVE



Pillars:



Maintain a queue of PillarPairs. When a pair moves fully off left, recycle to the right.



Randomize vertical position of the gap within \[gapMinCenterY, gapMaxCenterY] to keep fair gaps.



Decrease gap size gradually as score increases:



For example, gap = clamp(gapStart - score\*2, gapMin, gapStart).



Meteors:



Start spawn timer at meteorSpawnIntervalStart; reduce toward min as score increases:



meteorInterval = clamp(2.5 - score\*0.03, 1.2, 2.5)



Spawn Y random within safe band (avoid immediate overlap with pillars’ solid area if possible).



COLLISION RULES



Dragon vs Pillar: AABB (pillar) vs circle (dragon) => collision ends run.



Dragon vs Ground or Dragon outside top bound: collision ends run.



Dragon vs Meteor: circle vs circle => collision ends run.



Fireball vs Meteor: circle vs circle => destroy both; optional small score bonus (+1).



Fireball vs Pillar: optional despawn on impact (no pillar damage).



SCORING



+1 when the dragon passes the centerline of a PillarPair (only once per pair).



Optional: +1 for each meteor destroyed.



Display current score centered at top in large font.



Track best score in localStorage.



UI AND SCREENS



MENU:



Title: Flappy Dragon.



Buttons: Start, Controls, Mute.



Controls tooltip: Space/Up to flap, F to shoot. Tap to flap, on-screen button to shoot on mobile.



PLAY HUD:



Score at top center.



Mute icon and Pause icon in top corners.



On mobile, a semi-transparent Fire button bottom-right.



GAME\_OVER:



Show Score and Best.



Buttons: Play Again, Leave.



Play Again -> reset run.



Leave -> go back to MENU (or navigate to a URL if configured).



Accessibility:



Keyboard navigable menu buttons; visible focus ring.



Option for high-contrast HUD text.



ASSET LIST (placeholders allowed)



images/bg\_sky.png (480x800 or tiling)



images/bg\_mountains\_far.png



images/bg\_mountains\_near.png



images/ground.png (tileable strip ~112 px high)



images/dragon.png (multiple frames in a strip, optional)



images/pillar\_top.png, images/pillar\_bottom.png (castle pillars)



images/meteor.png



images/fireball.png



images/ui\_fire\_button.png (optional)



audio/flap.wav, audio/hit.wav, audio/point.wav, audio/shoot.wav, audio/explosion.wav



fonts (use system font fallback if none)



DIRECTORY STRUCTURE



index.html



styles.css



game.js



assets/



images/...



audio/...



RENDERING AND SCALING



Create a fixed virtual canvas (480x800).



Compute scale to fit window while preserving aspect ratio:



scale = min(window.innerWidth / 480, window.innerHeight / 800).



Use CSS to size the visible canvas; render logic stays in virtual coordinates.



Add letterboxing as needed.



MAIN LOOP (pseudocode)



Use requestAnimationFrame.



Track dt with a capped max (e.g., 1/30 s).



Update by state:



MENU: animate background; buttons interactive.



PLAY:



Read input (flap; shoot if cooldown elapsed).



Apply gravity to dragon, clamp velocity; update y.



Scroll pillars and meteors left by pillarSpeed or meteorSpeed\*dt.



Spawn/recycle pillars and meteors.



Update fireballs; cull expired.



Check collisions (order: lethal first).



Update score when crossing pillars.



GAME\_OVER: stop world updates except background; show UI.



Draw by layers: background -> pillars -> meteors -> fireballs -> dragon -> ground -> HUD.



INPUT HANDLING



Keyboard listeners for Space/ArrowUp (flap), F (shoot), P (pause).



Pointer events:



Tap/click anywhere in playfield = flap.



Tap/click Fire button rect = shoot (respect cooldown).



Debounce repeated keydown for flap as desired.



SOUND



Simple audio wrapper with mute toggle persisted in localStorage.



Play cues: flap (on flap), shoot (on fire), explosion (meteor destroyed), hit (on death), point (on score).



SAVE DATA



localStorage keys:



flappyDragon.bestScore = integer



flappyDragon.muted = "true"/"false"



RESET LOGIC



On Play Again:



Reset dragon y/velocity, score, timers, pillars, meteors, fireballs.



Keep best score.



On Leave:



Go to MENU (do not reload page).



PERFORMANCE TARGETS



60 fps on modern desktop and mobile browsers.



Avoid allocations in the update loop; use object pooling for pillars, meteors, and fireballs.



ACCEPTANCE CRITERIA



Start screen shows Start and Mute; clicking Start enters gameplay.



Dragon flaps with Space/Up/tap and is affected by gravity.



Pillars scroll in with randomized gaps; score increments when passing each pair.



Meteors periodically spawn from the right; F or on-screen Fire shoots a projectile that destroys meteors on contact.



Any collision of dragon with pillar, meteor, ground, or top bound ends the run and shows Game Over with score and best.



Play Again fully resets the run; Leave returns to Start.



Works with keyboard and mouse; has mobile tap and on-screen Fire.



Best score persists across reloads.



CODING NOTES FOR CODEX



Use a single ES module or IIFE in game.js; keep index.html minimal.



Implement a simple SceneManager with functions: enter(state), update(dt), draw(ctx), handleInput(evt).



Use constant objects for CONFIG and STRINGS at the top of game.js.



Provide stubs that gracefully draw geometric shapes if an asset is missing.



SUGGESTED CONSTANTS (drop into CONFIG)



width: 480, height: 800



gravity: 1800



flapImpulseVy: -520



maxFallSpeed: 900



pillar: { speed: 180, width: 90, gapStart: 220, gapMin: 150, spacingMinX: 280, spacingMaxX: 360 }



meteor: { speedMin: 260, speedMax: 340, spawnIntervalStart: 2.5, spawnIntervalMin: 1.2, radius: 14 }



fireball: { speed: 520, cooldown: 0.30, lifetime: 2.0, radius: 10 }



dragon: { x: 120, yStart: 300, hitRadius: 22 }



groundY: 720



SAMPLE FILE OUTLINES (skeletons, not full code)



index.html



Minimal HTML with a centered canvas, links to styles.css and game.js, and a noscript fallback.



styles.css



Body resets; canvas centered; letterboxing via background color; basic font settings.



game.js



CONFIG constants.



Asset loader (images, audio) with a preload counter.



SceneManager with MENU, PLAY, GAME\_OVER, PAUSE objects.



Entities: Dragon, PillarPair, Meteor, Fireball as simple factory functions or classes.



Input module: keyboard and pointer; on-screen Fire button rect.



Main loop with requestAnimationFrame, dt clamp, update/draw dispatch.



localStorage helpers.



Start with SceneManager.enter("BOOT") then go to MENU on assets loaded.



TEST CHECKLIST



Flap responsiveness: one tap equals one impulse; no stuck repeats.



Collision fairness: dragon’s circle vs pillar rects behaves as expected at edges.



Fire cooldown respected; holding F should not exceed rate.



Meteor hits dragon cause immediate Game Over; fireball hits meteor reliably destroy it.



Score increments once per pillar pair; no double counts.



Difficulty curve gradually increases; later gaps smaller and slightly faster pillars.



Window resize maintains aspect correctly.



Mute persists; best score persists.



OPTIONAL V1.1 ENHANCEMENTS (non-blocking)



Shield power-up.



Explosions and particles.



Day/night palette swap.



Simple settings menu for difficulty.



Seeded RNG for repeatable runs.



ONE-SHOT CODEGEN PROMPT YOU CAN PASTE INTO CODEX

Generate an HTML5 Canvas game called "Flappy Dragon" per the spec below. Create three files: index.html, styles.css, game.js. The game runs in portrait with a fixed virtual resolution of 480x800 scaled to fit. Implement states MENU, PLAY, GAME\_OVER (optional PAUSE). Controls: Space/Up/tap to flap; F or on-screen Fire button to shoot a fireball; P toggles pause. Obstacles are castle pillar pairs scrolling left with randomized vertical gaps. Meteors spawn from the right and move left; fireballs destroy meteors on collision. Any collision of the dragon with a pillar, meteor, ground (y >= 720), or top bound ends the run. Score +1 per pillar pair passed; optionally +1 per meteor destroyed. Track best score and mute in localStorage. Use the following CONFIG constants and hitboxes: dragon circle radius 22; meteor radius 14; fireball radius 10; pillar width 90; gravity 1800; flap impulse vy -520; max fall speed 900; pillar speed 180; gap starts at 220 and never below 150; meteor speed 260–340; meteor spawn interval starts at 2.5 s down to 1.2 s; fireball speed 520; fire cooldown 0.30 s; fireball lifetime 2.0 s; dragon x = 120. Implement an asset loader but render geometric placeholders if assets are missing. Provide a visible Start button and a Game Over screen with "Play Again" (reset) and "Leave" (return to MENU). Keep dependencies to zero, do not use frameworks. Ensure 60 fps where possible and pause the game when the tab loses focus.





