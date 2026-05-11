# Drop Rush: Sky Panic

A mobile-first Phaser 3 arcade game boilerplate built with TypeScript and Vite.

The project starts with a portrait 1080x1920 game canvas, dark background, mobile-friendly scaling, and a basic playable scene with a horizontally movable paddle at the bottom of the screen.

## Tech Stack

- Phaser 3
- TypeScript
- Vite

## Project Structure

```text
src/
  assets/        Static game assets such as sprites, audio, and atlases
  game/          Shared Phaser configuration and game-level constants
  scenes/        Phaser scenes and scene-specific gameplay code
  main.ts        Browser entry point that creates the Phaser game instance
```

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Gameplay Prototype

- The player paddle sits near the bottom of the portrait play area.
- Move the pointer horizontally with mouse or touch to control the paddle.
- The `GameScene` includes the core Phaser lifecycle methods (`preload`, `create`, and `update`) so future falling objects, scoring, collision, and difficulty systems can be added cleanly.
