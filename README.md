# Bitburner Scripts

A personal collection of TypeScript scripts for [Bitburner](https://store.steampowered.com/app/1812820/Bitburner/).

This project started from the [official Bitburner TypeScript template](https://github.com/bitburner-official/typescript-template). It now uses Docker Compose and `bitburner-filesync` to sync TypeScript files directly to the game—without a build or transpilation step.

## Requirements

- Docker
- Docker Compose
- Bitburner with the Remote API enabled

You don’t need to install Node.js or npm on your computer; the Compose service runs `bitburner-filesync` in a Node container.

## Getting started

1. Clone this repository and open a terminal in the project directory.
2. Ensure the definitions file expected by the project exists: `touch NetscriptDefinitions.d.ts`
3. Start the container: `docker compose up --detach`
4. In Bitburner, open Options → Remote API, connect to the port configured by this project, and allow the connection. 

The container runs in the background. As you edit or add scripts under `src/`, the project’s Docker setup handles the build and synchronization with Bitburner.

## Stopping the container

From the project directory, run: `docker compose down`

## Scripts

Write TypeScript scripts in `src/`. They are synced to Bitburner as .ts files; the game handles them directly. No JavaScript output is generated.
