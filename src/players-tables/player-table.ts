class PlayerTable {
    public playerId: number;

    constructor(
        private game: AzulGame, 
        player: AzulPlayer) {

        this.playerId = Number(player.id);

        let html = `<div id="player-table-wrapper-${this.playerId}">
        <div class="player-name" style="color: #${player.color};">
            ${player.name}
        </div>
        <div id="player-table-${this.playerId}" class="player-table">`;
        for (let i=1; i<=5; i++) {
            html += `<div id="player-table-${this.playerId}-line${i}" class="line" style="top: ${10 + 70*(i-1)}px; width: ${69*i - 5}px;"></div>`;
        }
        html += `<div id="player-table-${this.playerId}-line0" class="floor line"></div>`;
        html += `<div id="player-table-${this.playerId}-wall" class="wall"></div>`;
        html += `    </div>
        </div>`;

        dojo.place(html, 'players-tables');

        for (let i=0; i<=5; i++) {
            document.getElementById(`player-table-${this.playerId}-line${i}`).addEventListener('click', () => this.game.selectLine(i));
        }

        for (let i=0; i<=5; i++) {
            const tiles = player.lines.filter(tile => tile.line === i);
            this.placeTilesOnLine(tiles, i);
        }

        this.placeTilesOnWall(player.wall);
    }

    public placeTilesOnLine(tiles: Tile[], line: number) {
        this.game.removeTiles(tiles);
        
        const top = line ? 0 : 43;
        tiles.forEach(tile => {
            if (line !== 0 || tile.column <= 7) {
                const position = line ? `right: ${(tile.column-1) * 69}px` : `left: ${3 + (tile.column-1) * 74}px`;
                dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="${position}; top: ${top}px;"></div>`, `player-table-${this.playerId}-line${line}`);
            }
        });
    }

    public placeTilesOnWall(tiles: Tile[]) {
        this.game.removeTiles(tiles);

        tiles.forEach(tile => {
            const position = `left: ${(tile.column-1) * 69}px; top: ${(tile.line-1) * 69}px`;
            dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="${position};"></div>`, `player-table-${this.playerId}-wall`);
        });
    }
}