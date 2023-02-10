# What is this project ? 
This project is an adaptation for BoardGameArena of game Azul edited by Plan B.
You can play here : https://boardgamearena.com

# How to install the auto-build stack

## Install builders
Intall node/npm then `npm i` on the root folder to get builders.

## Auto build JS and CSS files
In VS Code, add extension https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave and then add to config.json extension part :
```json
        "commands": [
            {
                "match": ".*\\.ts$",
                "isAsync": true,
                "cmd": "npm run build:ts"
            },
            {
                "match": ".*\\.scss$",
                "isAsync": true,
                "cmd": "npm run build:scss"
            }
        ]
    }
```
If you use it for another game, replace `azul` mentions on package.json `build:scss` script and on tsconfig.json `files` property.

## Auto-upload builded files
Also add one auto-FTP upload extension (for example https://marketplace.visualstudio.com/items?itemName=lukasz-wronski.ftp-sync) and configure it. The extension will detected modified files in the workspace, including builded ones, and upload them to remote server.

## Hint
Make sure ftp-sync.json and node_modules are in .gitignore

# Debug utils
## generate debug lines from a replay position
function getDebugLines(playerId) {
    for (line = 1; line <= 5; line++) {
        const lineId = `player-table-${playerId}-line${line}`;
        const count = document.getElementById(lineId).childElementCount;
        if (count > 0) {
            const color = document.getElementById(lineId).children[0].classList[1].match(/(\d)/)[0];
            console.log(`$this->debugSetLineTiles(${playerId}, ${line}, ${count}, ${color});\n`);
        }
    }
}
getDebugLines(88616973)

function getDebugWall(playerId) {
    for (line = 1; line <= 5; line++) {
        for (column = 1; column <= 5; column++) {
            const spotId = `player-table-${playerId}-wall-spot-${line}-${column}`;
            const tile = Array.from(document.getElementById(spotId).children).find(elem => elem.classList.contains('tile'));
            if (tile) {
                const color = tile.classList[1].match(/(\d)/)[0];
                console.log(`$this->debugSetWallTile(${playerId}, ${line}, ${column}, ${color});\n`);
            }
        }
    }
}
getDebugWall(88616973)

## see factoriesFilled notifs from a replay
JSON.stringify(
g_gamelogs.map(log => log.data).filter(notifs => notifs.some(notif => notif.type === "factoriesFilled")).map(notifs => notifs.find(notif => notif.type === "factoriesFilled").args)
)

# TODO
-The red background should be adjusted, it's very intense and it breaks up the visual of the factory tile outline where we put the tiles.
-The bag gets lost in the background and is so small! Maybe have it adjusted to the same size and layout as the original version.
-Would it be possible to make the reverse side variant of the factory tiles available? It's a small variant built into this version.