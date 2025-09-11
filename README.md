# Simple Runescape - Advanced Single Player Browser Game

An advanced single-player browser-based RPG inspired by Runescape, featuring 8 skills, complex quests, achievements, dynamic combat with special abilities, and a rich game world with 9 locations.

## Features

### Core Gameplay
- **Character Progression**: Level up 8 different skills with unique mechanics
- **Advanced Combat System**: Turn-based combat with special abilities and cooldowns
- **Rich Economy**: Buy/sell items, manage inventory, bank storage
- **Dynamic World**: 9 locations with unique activities and enemies
- **Achievement System**: Unlock achievements for various accomplishments
- **Complex Quest System**: 5 quests with multiple objectives and skill requirements

### Skills (8 Total)
- **Combat Skills**: Attack, Defense, Strength - gained through fighting
- **Gathering Skills**: Mining (ore extraction), Fishing (catch fish), Woodcutting (chop trees)
- **Processing Skills**: Smithing (forge equipment), Cooking (prepare food), Firemaking (burn logs)
- **Support Skills**: Prayer (bury bones for experience)
- **Experience System**: Progressive leveling with increasing XP requirements

### Locations (9 Total)
- **Lumbridge**: Starting town with chickens and basic amenities
- **Wilderness**: Dangerous area with goblins, bears, and skeletons
- **Mining Site**: Extract copper, tin, iron, and clay ore
- **Furnace**: Smith ore into bars and equipment
- **Cooking Range**: Prepare food for health restoration
- **River**: Fish for food and experience
- **Forest**: Chop trees for logs and woodcutting XP
- **General Store**: Buy/sell tools and supplies
- **Bank**: Secure storage for items and coins
- **Campfire Area**: Burn logs for firemaking experience

### Combat System
- **Turn-based combat** with attack, defend, and flee options
- **Special Abilities**: Power Strike (high damage), Defensive Stance (damage reduction), Healing Prayer (restore health)
- **Equipment Bonuses**: Weapons and armor provide stat bonuses
- **Dynamic Enemy Spawning**: Context-aware encounters based on location and level
- **8 Enemy Types**: From basic chickens to advanced guards

### Quests (5 Total)
- **Chicken Hunter**: Kill 10 chickens (Combat introduction)
- **Cook's Assistant**: Gather eggs for cooking (Gathering quest)
- **Doric's Quest**: Mine ore for the dwarf (Mining quest)
- **Wilderness Warrior**: Defeat wilderness creatures (Combat challenge)
- **Master Survivor**: Master fishing, firemaking, and cooking (Multi-skill challenge)

## How to Play

### Getting Started
1. **Explore**: Use location buttons to travel between areas
2. **Train Skills**: Each skill has unique training methods:
   - **Combat**: Fight enemies in different locations
   - **Mining**: Extract ore at the Mining Site
   - **Fishing**: Catch fish at the River
   - **Woodcutting**: Chop trees in the Forest
   - **Firemaking**: Burn logs at the Campfire Area
   - **Cooking**: Prepare food at the Cooking Range
   - **Smithing**: Forge equipment at the Furnace
   - **Prayer**: Bury bones anywhere
3. **Complete Quests**: Start quests to earn rewards and experience
4. **Manage Equipment**: Buy tools from the shop and equip them
5. **Save Progress**: Use Save/Load buttons to preserve your game

### Combat
- **Basic Actions**: Attack, Defend, Flee
- **Special Abilities**:
  - **Power Strike**: High damage attack (3 turn cooldown)
  - **Defensive Stance**: Reduce damage taken (4 turn cooldown)
  - **Healing Prayer**: Restore health (5 turn cooldown, requires Prayer level 5)

### Economy
- **Shop**: Buy tools, weapons, and food
- **Bank**: Store items securely for later use
- **Trading**: Sell unwanted items for coins

## Controls

### Navigation
- **Location Buttons**: Travel between different areas
- **Activity Buttons**: Perform location-specific actions

### Skills Training
- **Mine Rocks**: Extract ore (Mining Site)
- **Go Fishing**: Catch fish (River)
- **Chop Trees**: Cut down trees (Forest)
- **Burn Logs**: Light fires (Campfire Area)
- **Cook Food**: Prepare meals (Cooking Range)
- **Smith Bars**: Forge equipment (Furnace)
- **Bury Bones**: Gain prayer experience (Anywhere)

### Combat & Quests
- **Fight Buttons**: Engage enemies
- **Explore for Enemies**: Random encounters
- **Ability Buttons**: Use special combat abilities
- **Quest Buttons**: Start and track quest progress
- **Achievement System**: Automatic unlocks for accomplishments

### Management
- **Inventory**: Click items to use/equip them
- **Save/Load**: Preserve game progress
- **Bank**: Store items securely

## Running the Game

### Option 1: Local Server (Recommended)
```bash
python -m http.server 8000
```

Then open your browser and go to: `http://localhost:8000`

### Option 2: Direct File Opening
Simply open `index.html` in your web browser (some features may not work due to CORS restrictions)

## Game Mechanics

### Combat
- Turn-based system with player and enemy turns
- Damage calculation: `(Skill Level + Random(0-5)) - Enemy Defense`
- Experience gained: Attack, Strength, and Defense skills
- Loot drops from defeated enemies

### Mining
- Success rate: `30% + (Mining Level × 10%)`, max 80%
- Copper ore: 60% chance when successful
- Tin ore: 40% chance when successful
- Experience: 25 XP per successful mining attempt

### Leveling
- Skills level up when experience reaches the required amount
- Experience requirement increases by 20% each level
- Overall player level is average of combat skills
- Health increases with overall level

### Inventory
- 12 slots available
- Items can be equipped by clicking them
- Weapons provide attack bonuses
- Armor provides defense bonuses

## Technical Details

- **Frontend**: HTML, CSS, JavaScript
- **Dynamic Updates**: HTMX for enhanced interactivity
- **Styling**: Custom CSS with game-like appearance
- **State Management**: JavaScript objects for game state
- **Persistence**: Browser localStorage for save/load
- **No Backend**: All game logic runs client-side

## Game Mechanics

### Combat System
- Turn-based combat with player and enemy turns
- Damage calculation: `(Skill Level + Equipment Bonus + Random) - Enemy Defense`
- Special abilities with cooldown mechanics
- Equipment bonuses for weapons and armor

### Skill Progression
- 8 unique skills with individual leveling systems
- Experience requirements increase by 20% per level
- Tool bonuses for gathering skills
- Level requirements for accessing content

### Economy System
- Shop with stock management and pricing
- Bank storage system (12 slots)
- Trading system with buy/sell mechanics
- Currency system with coin accumulation

### Quest System
- 5 complex quests with multiple objectives
- Skill-based requirements and rewards
- Progress tracking with detailed descriptions
- Integration with all game systems

### Achievement System
- Automatic achievement unlocking
- Various accomplishment types (combat, skills, quests, wealth)
- Reward system with items and experience
- Progress tracking for player engagement

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript features (Arrow functions, Template literals, etc.)
- CSS Grid and Flexbox
- HTMX library
- localStorage API
- Modern DOM manipulation

## Future Enhancements

Potential features that could be added:
- Sound effects and background music
- Animated sprites and improved graphics
- Multiplayer cooperative elements
- More complex quests with storylines
- Equipment degradation and repair system
- Mini-games and side activities
- Player customization options
- Advanced combat mechanics (magic, ranged)
- Guild/clan system
- Seasonal events and content

Enjoy your adventure in this advanced Simple Runescape experience! 🗡️⚔️🏹

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript features
- CSS Grid and Flexbox
- HTMX library

Enjoy your adventure in Simple Runescape!
