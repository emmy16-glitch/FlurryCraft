# Sword Guard and Perfect Parry — Survival

## What changed
Survival players can now use a **real sword defense stance**, rather than
only mining/attacking with the same button. This is local gameplay and does
**not** grant cryptocurrency, fake loot or automatic mission completion.

- **Desktop:** equip a sword, face an enemy, **hold G** to raise the sword.
- **Mobile landscape:** equip a sword, hold the new **🛡 GUARD** button near
  the other action buttons. You may continue aiming with your other thumb.
- **Tap-to-attack:** release Guard before using your normal MINE / ATTACK
  control. Guarding never places, mines, eats or shoots.
- The **Sword Guard** meter shows remaining defensive stamina and recovery.
  While holding Guard, the sword visually rises and movement slows.
- Only equipped actual swords (including earned upgrades) work. A pickaxe,
  empty hand or ordinary building material cannot guard.

## Damage rules
Frontal melee attacks and frontal arrows can be blocked within 70 degrees
of your facing direction. Rear and flank attacks still hit at full strength.
Normal guard reduces eligible damage by **60%**. Guard raised within **0.22 s**
of an eligible hit executes a **Perfect Parry**, reducing that hit by **85%**
and softening knockback. No unlimited invulnerability: guarding continuously
drains stamina (14/sec) and blocking a hit costs at least 20 stamina plus
damage scaling. Insufficient stamina breaks Guard, and a **1.6 s** cooldown
applies before recovery. Stamina refills at 34/sec when not guarding and
not in cooldown. Even a perfect block deals a small chip hit (at least 0.25 HP).

**Not blockable:** falling, drowning, starving, fire/lava, explosions, boss
pulses/AOE. Blocking does not prevent death from other hazards. Armor and
Winter Ward protections remain separate from the sword mechanic.

## Compatibility and verification
Guard stamina is temporary and resets when starting another world or
respawning. Save files and wallet/marketplace settings are unchanged.
Regression tests cover facing direction, perfect timing, stamina
exhaustion, real player mitigation, attack exclusion and interrupted
mobile input. The PR CI also runs real Chromium gameplay on desktop and
emulated touch landscape. Those tests are not physical Android FPS tests.

### Manual gameplay checklist
1. Equip starter wooden sword in Survival. Press G or hold 🛡 on mobile.
   Confirm weapon raises, meter drains and speed is reduced.
2. Face a Frostling and parry immediately before its melee hit; verify
   reduced damage. Release Guard then attack normally.
3. Hold Guard continuously; confirm stamina empties and cooldown occurs.
4. Turn your back to the Frostling; guard must not mitigate the rear hit.
5. Open inventory or Pause while holding mobile Guard. The guard button
   must release. Background the tab or rotate screen and repeat.
6. Verify creative free-building and bow, blocks, melee and dungeon loops
   remain functional. Confirm no rewards or Testnet activity are triggered.
