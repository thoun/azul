const HAND_CENTER = 327;

class PlayerTable {
    public playerId: number;

    constructor(
        private game: AzulGame, 
        player: AzulPlayer) {

        this.playerId = Number(player.id);

        const nameClass = player.name.indexOf(' ') !== -1 ? 'with-space' : 'without-space';

        let html = `<div id="player-table-wrapper-${this.playerId}" class="player-table-wrapper">
        <div id="player-hand-${this.playerId}" class="player-hand ${player.hand.length ? '' : 'empty'}">
        </div>
        <div id="player-table-${this.playerId}" class="player-table ${this.game.isVariant() ? 'variant' : ''}" style="border-color: #${player.color}; box-shadow: 0 0 5px 2px #${player.color};">
            <div class="player-name-wrapper shift">
                <div id="player-name-shift-${this.playerId}" class="player-name color ${game.isDefaultFont() ? 'standard' : 'azul'} ${nameClass}" style="color: #${player.color};">${player.name}</div>
            </div>
            <div class="player-name-wrapper">
                <div id="player-name-${this.playerId}" class="player-name dark ${game.isDefaultFont() ? 'standard' : 'azul'} ${nameClass}">${player.name}</div>
            </div>`;
            
        for (let i=1; i<=5; i++) {
            html += `<div id="player-table-${this.playerId}-line${i}" class="line" style="top: ${10 + 70*(i-1)}px; width: ${69*i - 5}px;"></div>`;
        }
        html += `<div id="player-table-${this.playerId}-line0" class="floor line"></div>`;
        html += `<div id="player-table-${this.playerId}-wall" class="wall">`;

        // color-blind marks on wall
        for (let line=1; line<=5; line++) {
            const column = ((line + 1) % 5) + 1;
            html += `<div class="wall-tile-cb" style="left: ${69*(column-1) +4}px; top: ${70*(line-1) +4}px;"></div>`;
        }

        for (let line=1; line<=5; line++) {
            for (let column=1; column<=5; column++) {
                html += `<div id="player-table-${this.playerId}-wall-spot-${line}-${column}" class="wall-spot" style="left: ${69*(column-1) - 1}px; top: ${70*(line-1) - 1}px;"></div>`;
            }
        }
        html += `</div>`;
        if (this.game.isVariant()) {
            html += `<div id="player-table-${this.playerId}-column0" class="floor wall-spot"></div>`;
        }
        
        html += `
            <div class="score-magnified row">2</div>
            <div class="score-magnified column">7</div>
            <div class="score-magnified color">10</div>
        `;

        html += `    </div>
        </div>`;

        dojo.place(html, 'centered-table');

        this.placeTilesOnHand(player.hand);

        for (let i=0; i<=5; i++) {
            document.getElementById(`player-table-${this.playerId}-line${i}`).addEventListener('click', () => this.game.selectLine(i));
        }
        if (this.game.isVariant()) {
            for (let line=1; line<=5; line++) {
                for (let column=1; column<=5; column++) {
                    document.getElementById(`player-table-${this.playerId}-wall-spot-${line}-${column}`).addEventListener('click', () => {
                        this.game.selectColumn(column);
                    });
                }
            }
            document.getElementById(`player-table-${this.playerId}-column0`).addEventListener('click', () => this.game.selectColumn(0));
        }

        for (let i=0; i<=5; i++) {
            const tiles = player.lines.filter(tile => tile.line === i);
            this.placeTilesOnLine(tiles, i);
        }

        this.placeTilesOnWall(player.wall);

        
        if (this.game.isVariant()) {
            // if player hit refresh when column is selected but not yet applied, we reset ghost tile
            if (this.playerId === this.game.getPlayerId()) {
                player.selectedColumns.forEach(selectedColumn => this.setGhostTile(selectedColumn.line, selectedColumn.column, selectedColumn.color));
            }
        }
    }

    public placeTilesOnHand(tiles: Tile[]) {
        const startX = HAND_CENTER - tiles.length * (HALF_TILE_SIZE + 5);
        tiles.forEach((tile, index) => this.game.placeTile(tile, `player-hand-${this.playerId}`, startX + (tiles.length - index) * (HALF_TILE_SIZE + 5) * 2, 5));
        this.setHandVisible(tiles.length > 0);
    }

    public placeTilesOnLine(tiles: Tile[], line: number): Promise<any> {
        return Promise.all(tiles.map(tile => {
            const left = line ? (line - tile.column) * 69 : 5 + (tile.column-1) * 74;
            return this.game.placeTile(tile, `player-table-${this.playerId}-line${line}`, left, 0);
        }));
    }

    public placeTilesOnWall(tiles: Tile[]) {
        tiles.forEach(tile => this.game.placeTile(tile, `player-table-${this.playerId}-wall-spot-${tile.line}-${tile.column}`));
    }
    
    public setHandVisible(visible: boolean) {
        dojo.toggleClass(`player-hand-${this.playerId}`, 'empty', !visible);
    }

    public setGhostTile(line: number, column: number, color: number) {
        const spotId = `player-table-${this.playerId}-wall-spot-${line}-${column}`;
        const ghostTileId = `${spotId}-ghost-tile`;
        const existingGhostTile = document.getElementById(ghostTileId);
        existingGhostTile?.parentElement.removeChild(existingGhostTile);
        if (column > 0) {
            dojo.place(`<div id="${ghostTileId}" class="tile tile${color} ghost"></div>`, spotId);
        }
    }
    
    public setFont(prefValue: number): void {
        const defaultFont = prefValue === 1;
        dojo.toggleClass(`player-name-shift-${this.playerId}`, 'standard', defaultFont);
        dojo.toggleClass(`player-name-shift-${this.playerId}`, 'azul', !defaultFont);
        dojo.toggleClass(`player-name-${this.playerId}`, 'standard', defaultFont);
        dojo.toggleClass(`player-name-${this.playerId}`, 'azul', !defaultFont);
    }
}