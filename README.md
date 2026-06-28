# Paper Ball

## Local Development (Vite)

Install local dependencies
- Install NPM libraries: `npm i`

Launch Vite dev server (without Tauri)
- Run: `npm run dev`

## Local Development (Vite + Tauri)

Windows Requirements
- Rust - Run command in terminal: winget install --id Rustlang.Rustup
- link.exe - [Download Build Tools for Visual Studio](https://visualstudio.microsoft.com/downloads/) (Scroll down and select "Tools for Visual Studio", then select "Download" next to "Build Tools for Visual Studio"). Open and select "Desktop development with C++", then select "Install"

Install local dependencies
- Install NPM libraries: `npm i`

Launch Vite + Tauri dev server
- Run: `npm run tauri dev`
## Building Extension

Build Chrome extension
- Run `npm run build-extension`
- Upload `/dist-extension/paper-ball-#.#.#-chrome.zip` to Chrome Web Store

## Building Tauri Application

Build portable app
- Run `npm run build-tauri`
- Open `.exe` in `/src-tauri/target/release/paper-ball.exe`

## Rebuilding Desktop Tauri App Icons

- Update the main icon `/public/png/icon256.png`
- Run `npm run build-tauri-icon`

## Install Steamworks SDK (only needed once)

- Win: Download Steamworks SDK (`https://partner.steamgames.com/doc/sdk`). Then extract contents into a new folder. Ex: `C:\steamworks\sdk`
- Copy/Paste build scripts
  - Option 1: Watch videos showing how to do it: `https://partner.steamgames.com/doc/sdk/uploading`
  - Option 2:
    - Win: Copy the build & depot `.vdf` files from `/files/vdf/` to `C:\steamworks\sdk\tools\ContentBuilder\scripts`

## Building to Steam (Windows)

- Copy app files:
  - Copy `.exe` file: `D:\Development\paper-ball\src-tauri\target\release\`
  - Paste: `C:\steamworks\sdk\tools\ContentBuilder\content\paper-ball\windows`
- Run SteamCMD `C:\steamworks\sdk\tools\ContentBuilder\builder\steamcmd.exe +login fragem123`
- Run build script `run_app_build C:\steamworks\sdk\tools\ContentBuilder\scripts\app_build_#######.vdf`.

## Publish on Steam

- Navigate to the Partner Builds page: `https://partner.steamgames.com/apps/builds/#######`
- Scroll to the latest `BuildID` and set the dropdown to the `default` branch, the click "Preview Change" to "publish" to Steam users.