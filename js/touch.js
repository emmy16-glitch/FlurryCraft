// On-screen touch controls: left joystick, right-side drag-look (tap = place/use, hold = mine), buttons, tappable hotbar.
const $ = (id) => document.getElementById(id);
export function initTouch(game, player, ui, hooks) {
  if (game.touchEl) return;
  document.body.classList.add('touch');
  const root = $('touch'); game.touchEl = root; root.style.display = 'block';
  const T = game.touch = { fwd: 0, strafe: 0, jump: false, left: false, attackPressed:false, right: false, rightPressed: false, sneak: false, sprint: false };
  const sens = () => 0.0052 * (hooks.settings.sens / 100);

  // A touch event is valid only while the actual game world accepts inputs.
  // CSS can hide controls without delivering pointerup/pointercancel.
  const canAct = () => game.state === 'play' && !game.paused && !ui.isOpen &&
    !player.dead && document.visibilityState !== 'hidden' &&
    document.getElementById('flurryModal')?.style?.display !== 'flex';
  const buttonResets = [];
  let mineButtonHeld = false, mineLookHeld = false, placeHeld = false, placePulseTimer = null;
  const syncMining = () => { T.left = mineButtonHeld || mineLookHeld; };
  const releaseCaptured = (el, id) => {
    if (id === null) return;
    try { if (el.hasPointerCapture?.(id)) el.releasePointerCapture(id); } catch {}
  };

  // ---- joystick (independent pointer for simultaneous move + look)
  const jz = $('joyzone'), base = $('joybase'), knob = $('joyknob');
  let jid = null, ox = 0, oy = 0; const R = 52;
  const joyMove = (e) => {
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const l = Math.hypot(dx, dy);
    if (l > R) { dx = dx / l * R; dy = dy / l * R; }
    T.strafe = Math.abs(dx / R) < .12 ? 0 : dx / R;
    T.fwd = Math.abs(dy / R) < .12 ? 0 : -dy / R;
    T.sprint = l > R * 1.55;
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  };

  // ---- right-side look / long-press mining / tap-to-place
  const lz = $('lookzone');
  let lid = null, lx = 0, ly = 0, t0 = 0, moved = 0, holdTimer = null;
  const resetAll = () => {
    const oldJoy = jid, oldLook = lid;
    jid = null; lid = null;
    clearTimeout(holdTimer); holdTimer = null;
    clearTimeout(placePulseTimer); placePulseTimer = null;
    for (const reset of buttonResets) reset();
    mineButtonHeld = mineLookHeld = placeHeld = false;
    Object.assign(T, { fwd: 0, strafe: 0, jump: false, left: false,
      attackPressed: false, right: false, rightPressed: false, sneak: false, sprint: false });
    base.style.display = 'none';
    knob.style.transform = 'translate(0,0)';
    $('tbSneak').classList.remove('on');
    releaseCaptured(jz, oldJoy);
    releaseCaptured(lz, oldLook);
  };
  // Also called from pause / overlays / world transitions.
  game.resetTouchControls = resetAll;
  window.addEventListener('blur', resetAll);
  window.addEventListener('pagehide', resetAll);
  window.addEventListener('orientationchange', resetAll);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') resetAll();
  });

  jz.addEventListener('pointerdown', (e) => {
    if (jid !== null || !canAct()) return;
    jid = e.pointerId; jz.setPointerCapture(jid);
    ox = e.clientX; oy = e.clientY;
    base.style.display = 'block';
    base.style.left = (ox - 70) + 'px'; base.style.top = (oy - 70) + 'px';
    knob.style.transform = 'translate(0,0)';
    e.preventDefault();
  });
  jz.addEventListener('pointermove', (e) => {
    if (e.pointerId !== jid) return;
    if (!canAct()) { resetAll(); return; }
    joyMove(e);
  });
  const jend = (e) => {
    if (e.pointerId !== jid) return;
    const id = jid; jid = null;
    T.fwd = T.strafe = 0; T.sprint = false;
    base.style.display = 'none'; knob.style.transform = 'translate(0,0)';
    releaseCaptured(jz, id);
  };
  jz.addEventListener('pointerup', jend);
  jz.addEventListener('pointercancel', jend);
  jz.addEventListener('lostpointercapture', jend);

  lz.addEventListener('pointerdown', (e) => {
    if (lid !== null || !canAct()) return;
    lid = e.pointerId; lz.setPointerCapture(lid);
    lx = e.clientX; ly = e.clientY; t0 = performance.now(); moved = 0;
    const thisPointer = lid;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      holdTimer = null;
      if (lid === thisPointer && moved < 12 && canAct()) {
        mineLookHeld = true; syncMining();
      }
    }, 320);
    e.preventDefault();
  });
  lz.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lid) return;
    if (!canAct()) { resetAll(); return; }
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    player.yaw -= dx * sens();
    player.pitch = Math.max(-1.5533, Math.min(1.5533, player.pitch - dy * sens()));
  });
  const lend = (e, cancelled = false) => {
    if (e.pointerId !== lid) return;
    const id = lid; lid = null;
    clearTimeout(holdTimer); holdTimer = null;
    const wasMining = mineLookHeld;
    mineLookHeld = false; syncMining();
    releaseCaptured(lz, id);
    // Pointer cancellation, lost capture, pause and hidden tabs may never
    // place blocks; only a completed, intentional short tap may do so.
    if (!cancelled && !wasMining && canAct() &&
        performance.now() - t0 < 260 && moved < 14) {
      clearTimeout(placePulseTimer);
      T.right = true; T.rightPressed = true;
      placePulseTimer = setTimeout(() => {
        placePulseTimer = null; T.right = placeHeld;
      }, 110);
    }
  };
  lz.addEventListener('pointerup', (e) => lend(e));
  lz.addEventListener('pointercancel', (e) => lend(e, true));
  lz.addEventListener('lostpointercapture', (e) => lend(e, true));
  // ---- buttons
  const hold = (id, on, off) => {
    const el = $(id); let heldId = null;
    const end = (e) => {
      if (e.pointerId !== heldId) return;
      const id = heldId; heldId = null;
      el.classList.remove('down'); if (off) off();
      releaseCaptured(el, id);
    };
    el.addEventListener('pointerdown', (e) => {
      if (!canAct() || heldId !== null) return;
      e.preventDefault();
      heldId = e.pointerId; el.setPointerCapture(heldId);
      el.classList.add('down'); on();
    });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    buttonResets.push(() => {
      const id = heldId; heldId = null;
      el.classList.remove('down'); if (off) off();
      releaseCaptured(el, id);
    });
  };
  hold('tbJump', () => {
    T.jump = true;
    const now = performance.now();
    if (player.creative && now - (game._lastTapJump || 0) < 300) {
      player.flying = !player.flying; player.vy = 0;
    }
    game._lastTapJump = now;
  }, () => { T.jump = false; });
  // Independent sources prevent releasing a look-hold from cancelling
  // an attack button that is still physically held.
  hold('tbBreak', () => {
    mineButtonHeld = true; syncMining(); T.attackPressed = true;
  }, () => { mineButtonHeld = false; syncMining(); });
  let lastPlacementTip = -10000;
  hold('tbPlace', () => { placeHeld = true; T.right = true; T.rightPressed = true;
    // Avoid flooding the view with large repeated messages while building.
    if (performance.now()-lastPlacementTip>7000) {
      if (!player.held()) {ui.toast('Choose a block with 🧱 BUILD first.');lastPlacementTip=performance.now();}
      else if (!player.target) {ui.toast('Aim the + at the SIDE or TOP of a block.');lastPlacementTip=performance.now();}
    }
  }, () => { placeHeld = false; if (!placePulseTimer) T.right = false; });
  const tap = (id, fn) => $(id).addEventListener('pointerdown', (e) => { if (!canAct()) return; e.preventDefault(); fn(e); });
  tap('tbSneak', () => { T.sneak = !T.sneak; $('tbSneak').classList.toggle('on', T.sneak); });
  tap('tbInv', () => { resetAll(); ui.openInventory(); });
  tap('tbMenu', () => { resetAll(); hooks.pause(); });
  tap('tbDrop', () => { const s = player.held(); if (!s) return; if (s.flurryUnlimited) {ui.toast('Use + ALL to change unlimited blocks.');return;} const cp = Math.cos(player.pitch); game.spawnItem(s.id, 1, player.x, player.eyeY - 0.3, player.z, s.d, [-Math.sin(player.yaw) * cp * 5, Math.sin(player.pitch) * 5 + 1.5, -Math.cos(player.yaw) * cp * 5]); s.n--; if (s.n <= 0) player.inv[player.sel] = null; ui.dirtyInv = true; });
  // Bottom hotbar selection and + ALL catalog are wired once by flurry.js,
  // before the mobile layer starts. Do not add duplicate touch handlers.
  const hb = $('hotbar'); hb.style.pointerEvents = 'auto'; hb.style.zIndex = 16;
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  // Menus, studio cards and settings MUST scroll on phones. Only stop native
  // browser scrolling during actual game gestures, not within UI overlays.
  document.addEventListener('touchmove', (e) => {
    if(e.target?.closest?.('#panel,#screen,#pause,#flurryModal,#fcQuickMenu,#fcBlueprintPreview,#fcMiniMap,#menu,#creative,#book,#worldlist'))
      return;
    e.preventDefault();
  }, { passive: false });
}
