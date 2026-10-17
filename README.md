# Bitburner Scripts

A personal collection of TypeScript scripts for [Bitburner](https://store.steampowered.com/app/1812820/Bitburner/).

This repository is based on the [official Bitburner TypeScript template](https://github.com/bitburner-official/typescript-template) and uses its Docker-based setup to compile and sync scripts with the game.

## Requirements

- Docker
- Docker Compose
- Bitburner with the Remote API enabled

## Getting started

1. Clone this repository and open a terminal in the project directory.
2. Ensure the definitions file expected by the project exists: `touch NetscriptDefinitions.d.ts`
3. Start the container: `docker compose up --build --detach`
4. In Bitburner, open Options → Remote API, connect to the port configured by this project, and allow the connection. 

The container runs in the background. As you edit or add scripts under `src/`, the project’s Docker setup handles the build and synchronization with Bitburner.

## Stopping the container

From the project directory, run: `docker compose down`

## Scripts

Write TypeScript scripts in `src/`. They will be compiled and synced to Bitburner by the running container.
