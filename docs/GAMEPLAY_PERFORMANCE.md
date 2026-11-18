# FlurryCraft performance and graphics upgrade

## Scope

This is a source- and automated-browser-tested WebGL voxel game, not an
offline-rendered or prerendered gameplay screenshot. No AAA-quality promise or
guarantee of 60 FPS on all phones is made.

### Visual and performance features

- **Auto / Sharp / Smooth:** new graphics selector both in the start-screen
  advanced options and in the in-game Pause → Settings menu. Saved per device.
- **Auto:** samples foreground frame intervals over multiple 2.5-second
  windows; gradually lowers the internal WebGL pixel ratio during sustained
  low frame rates and recovers sharpness only after sustained improvement.
  It avoids rapidly reallocating the framebuffer every few frames.
- **Sharp:** fixed high pixel ratio (bounded by real device density and
  a GPU-work limit). Choose when the device can render at high resolution.
- **Smooth:** smaller fixed pixel ratio plus a lower snow particle budget.
- **Auto view distance:** after prolonged poor rendering while already at
  minimum pixel density, the farthest chunk rings may be temporarily reduced
  by up to two; they can recover as performance improves. This does **not**
  rewrite the chosen render distance in saved settings or delete world blocks.
- **Voxel meshing:** urgent chunk remeshes and long blueprint placements
  are now limited by elapsed milliseconds per frame, not only a block count.
- **Battery/thermal:** a hidden browser tab no longer calls the active WebGL
  render/update paths.
- **Winter styling:** bright snowy initial demo atmosphere, existing player
  storm preference preserved, subtle atmospheric night aurora on the sky
  shader without adding postprocessing passes or draw calls.
- **Cleaner mobile UI:** limits duplicate toast stacks so the Yeti,
  crosshair and environment remain visible.
- **Settings guardrails:** sanitized graphics, view distance, FOV, volume,
  and look sensitivity loaded from local storage.

### How to play and compare

1. Start a world from https://emmy16-glitch.github.io/FlurryCraft/.
2. Open **Pause → Settings → Graphics quality** or the game-settings
   disclosure on the home screen.
3. Start with **Auto · Adaptive**. Select **Sharp · Quality** on a
   strong GPU or **Smooth · Performance** if the game stutters.
4. Adjust view distance down from 7 to 4–5 if desktop performance remains
   poor; on mobile start near 4. You can also change snow from Storm to
   Snowfall/Calm in the in-game menu for improved visibility.
5. Press F3 on desktop for a live FPS, chunk count, triangle count, render
   calls and graphics pixel-ratio diagnostic. A high FPS from a synthetic
   test is not evidence of every phone reaching it.

### Evidence and limitations

- The GitHub Actions Chromium suite launches **real 3D WebGL worlds** for
  1280 × 720 desktop and 873 × 393 touch-landscape emulation.
- It checks menus, world startup, real keyboard and virtual joystick movement,
  Rewards Hub and pixel-ratio settings, and collects screenshots and browser
  video artifacts. A controlled in-test Frostling is used to check the actual
  targeting/melee code, with no scripted wins or onchain rewards.
- GitHub hosted runners normally run WebGL through software GPU drivers.
  Their 95th-percentile frame times are **stress-test data, not a benchmark
  for a physical Android or modern gaming GPU**.
- **Remaining:** physical Android device and hardware GPU testing; varied
  render distances; rapid save/restore during combat and large blueprints;
  real wallets, sponsored transaction flow and Mainnet reward payouts.
- The Sui smart contract is separate from the browser's render pipeline;
  graphics work does not enable cryptocurrency payouts.
