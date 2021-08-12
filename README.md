# What is this project ? 
This project is an adaptation for BoardGameArena of game Azyl edited by Plan B.
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
If you use it for another game, replace `nicodemus` mentions on package.json `build:scss` script and on tsconfig.json `files` property.

## Auto-upload builded files
Also add one auto-FTP upload extension (for example https://marketplace.visualstudio.com/items?itemName=lukasz-wronski.ftp-sync) and configure it. The extension will detected modified files in the workspace, including builded ones, and upload them to remote server.

## Hint
Make sure ftp-sync.json and node_modules are in .gitignore

## TODO
fix background
remove useless code on tile placement
official variant art

one thing I would like to have is some way to recap scoring for players
as it is hard to follow all of them
maybe just put a button near every player board (or player panel) and on click highlight all tiles placed in last round with points on them
or one button which will turn on scoring for all of the players

+10 on scoring is cropped a bit

I tried also the variant
it is a bit confusing that nothing happens when you select the column for your tile
maybe you should move it immediately and score later
or maybe just put a ghost tile in its place (with opacity) and when everybody decides, remove it and score as ususal
don't know which is easier
anyway the game is ready for public alpha so we will ask the publisher for approval

and some stats are needed
at least for different scoring
and additionally please check spectator mode as there are some js errors there
