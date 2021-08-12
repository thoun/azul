const HAND_CENTER = 327;

class PlayerTable {
    public playerId: number;

    constructor(
        private game: AzulGame, 
        player: AzulPlayer) {

        this.playerId = Number(player.id);

        let html = `<div id="player-table-wrapper-${this.playerId}" class="player-table-wrapper">
        <div id="player-hand-${this.playerId}" class="player-hand ${player.hand.length ? '' : 'empty'}">
        </div>
        <div id="player-table-${this.playerId}" class="player-table ${this.game.isVariant() ? 'variant' : ''}" style="border-color: #${player.color}; box-shadow: 0 0 5px 2px #${player.color};">
           <div class="player-name" style="color: #${player.color};">${player.name}</div>
            <div class="player-name dark">${player.name}</div>`;
        for (let i=1; i<=5; i++) {
            html += `<div id="player-table-${this.playerId}-line${i}" class="line" style="top: ${10 + 70*(i-1)}px; width: ${69*i - 5}px;"></div>`;
        }
        html += `<div id="player-table-${this.playerId}-line0" class="floor line"></div>`;
        html += `<div id="player-table-${this.playerId}-wall" class="wall"></div>`;
        if (this.game.isVariant()) {
            for (let i=1; i<=5; i++) {
                html += `<div id="player-table-${this.playerId}-column${i}" class="column" style="left: ${384 + 69*(i-1)}px; width: ${64}px;"></div>`;
            }
            html += `<div id="player-table-${this.playerId}-column0" class="floor column"></div>`;
        }
        html += `        
            </div>
        </div>`;

        dojo.place(html, 'table');

        this.placeTilesOnHand(player.hand);

        for (let i=0; i<=5; i++) {
            document.getElementById(`player-table-${this.playerId}-line${i}`).addEventListener('click', () => this.game.selectLine(i));
        }
        if (this.game.isVariant()) {
            for (let i=0; i<=5; i++) {
                document.getElementById(`player-table-${this.playerId}-column${i}`).addEventListener('click', () => this.game.selectColumn(i));
            }
        }

        for (let i=0; i<=5; i++) {
            const tiles = player.lines.filter(tile => tile.line === i);
            this.placeTilesOnLine(tiles, i);
        }

        this.placeTilesOnWall(player.wall);
    }

    public placeTilesOnHand(tiles: Tile[]) {
        const startX = HAND_CENTER - tiles.length * (HALF_TILE_SIZE + 5);
        tiles.forEach((tile, index) => this.game.placeTile(tile, `player-hand-${this.playerId}`, startX + (tiles.length - index) * (HALF_TILE_SIZE + 5) * 2, 5));
        this.setHandVisible(tiles.length > 0);
    }

    public placeTilesOnLine(tiles: Tile[], line: number): Promise<any> {
        const top = line ? 0 : 45;
        return Promise.allSettled(tiles.map(tile => {
            const left = line ? (line - tile.column) * 69 : 5 + (tile.column-1) * 74;
            return this.game.placeTile(tile, `player-table-${this.playerId}-line${line}`, left, top);
        }));
    }

    public placeTilesOnWall(tiles: Tile[]) {
        tiles.forEach(tile => this.game.placeTile(tile, `player-table-${this.playerId}-wall`, (tile.column-1) * 69, (tile.line-1) * 69));
    }

    public setColumnTop(line: number) {
        for (let i=1; i<=5; i++) {
            document.getElementById(`player-table-${this.playerId}-column${i}`).style.top = `${10 + 70*(line-1)}px`;
        }
    }
    
    public setHandVisible(visible: boolean) {
        dojo.toggleClass(`player-hand-${this.playerId}`, 'empty', !visible);
    }
}