class PlayerTable {
    public playerId: number;

    constructor(
        private game: AzulGame, 
        player: AzulPlayer) {

        this.playerId = Number(player.id);

        let html = `<div id="player-table-wrapper-${this.playerId}" class="player-table-wrapper">
        <div id="player-table-${this.playerId}" class="player-table" style="border-color: #${player.color};">`;
        for (let i=1; i<=5; i++) {
            html += `<div id="player-table-${this.playerId}-line${i}" class="line" style="top: ${10 + 70*(i-1)}px; width: ${69*i - 5}px;"></div>`;
        }
        html += `<div id="player-table-${this.playerId}-line0" class="floor line"></div>`;
        html += `<div id="player-table-${this.playerId}-wall" class="wall colored-side"></div>`;
        html += `    </div>
        
            <div class="player-name" style="color: #${player.color};">${player.name}</div>
            <div class="player-name dark">${player.name}</div>
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
        const top = line ? 0 : 45;
        tiles.forEach(tile => {
            const left = line ? (line - tile.column) * 69 : 5 + (tile.column-1) * 74;
            this.game.placeTile(tile, `player-table-${this.playerId}-line${line}`, left, top);
        });
    }

    public placeTilesOnWall(tiles: Tile[]) {
        tiles.forEach(tile => this.game.placeTile(tile, `player-table-${this.playerId}-wall`, (tile.column-1) * 69, (tile.line-1) * 69));
    }
}