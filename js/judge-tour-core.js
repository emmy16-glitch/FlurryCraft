// The judge-first FlurryCraft tour is a navigational guide, not a simulated win.
// Every action opens existing REAL gameplay. No fabricated progress is granted.
export const JUDGE_TOUR_STEPS=Object.freeze([
  {id:'meet',title:'Meet Lofi the Yeti',tag:'START HERE',action:null,
    description:'Explore a snowy world and find Lofi near the wooden starter shack. Move with WASD or the left joystick; look around with the mouse or the right side of the screen.',
    tip:'You can stop this tour at any time. Your world stays playable and saves normally.'},
  {id:'battle',title:'Survive the winter',tag:'ADVENTURE',action:'adventure',
    description:'Use the starter sword to fight icy enemies. Open Winter Adventure to see your real level, dungeon chapters, and progression. Your first dungeon is Frost Ruins.',
    tip:'Only actual monster kills and dungeon clears count. The tour does not add XP or skip battles.'},
  {id:'build',title:'Build your own fortress',tag:'CREATE',action:'blocks',
    description:'Open the block picker, equip materials, and build. Use Walls & Floors or Save Building from the menu to create reusable blueprints.',
    tip:'On mobile: tap a block in your hotbar, then tap PLACE. Custom building blocks remain part of your world.'},
  {id:'rewards',title:'Complete quests and missions',tag:'PROGRESS',action:'rewards',
    description:'Open Rewards Hub to view level milestones, daily objectives, weekly challenges, and locally earned Flurry Points.',
    tip:'These are in-game points only, not withdrawable cryptocurrency. Crypto payouts are not launched.'},
  {id:'creator',title:'Share your creations',tag:'CREATOR STUDIO',action:'studio',
    description:'Open My Builds to explore the blueprint library. Save your designs, import verified public Walrus Testnet blueprints, or share a selected public build with consent.',
    tip:'Public Walrus uploads are optional. Never upload a world backup or a private design.'},
  {id:'sui',title:'See the Sui integration',tag:'SUI TESTNET',action:'marketplace',
    description:'Explore the Sui Testnet marketplace prototype and optional wallet inspector. An NFT mint or sale requires a verified published Move package and a wallet approval.',
    tip:'No contract-publishing step is required of players. NFT sales and crypto earning are not currently live.'}
]);
export const tourStep=(index)=>JUDGE_TOUR_STEPS[Math.max(0,Math.min(
  JUDGE_TOUR_STEPS.length-1,Number.isFinite(index)?Math.trunc(index):0))];
