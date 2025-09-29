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
        <div id="player-table-${this.playerId}" class="player-table data-board="${this.game.getBoardNumber()}" style="--player-color: #${player.color};">
            <div class="player-name-wrapper shift">
                <div id="player-name-shift-${this.playerId}" class="player-name color ${game.isDefaultFont() ? 'standard' : 'azul'} ${nameClass}">${player.name}</div>
            </div>
            <div class="player-name-wrapper">
                <div id="player-name-${this.playerId}" class="player-name dark ${game.isDefaultFont() ? 'standard' : 'azul'} ${nameClass}">${player.name}</div>
            </div>
            <div id="player-table-${this.playerId}-line-1" class="special-factory-zero factory" data-special-factory="6"></div>
            `;
            
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
        if (this.game.getBoardNumber()) {
            html += `<div id="player-table-${this.playerId}-column0" class="floor wall-spot"></div>`;
        }
        
        const boardSetPoints = this.game.getBoardSetPoints();
        html += `
            <div class="score-magnified row">${boardSetPoints.line}</div>
            <div class="score-magnified column">${boardSetPoints.column}</div>
            <div class="score-magnified color">${boardSetPoints.color}</div>
        `;

        html += `   
            </div>
        </div>`;

        dojo.place(html, 'centered-table');

        this.placeTilesOnHand(player.hand);

        for (let i=0; i<=5; i++) {
            document.getElementById(`player-table-${this.playerId}-line${i}`).addEventListener('click', () => this.game.selectLine(i));
        }
        document.getElementById(`player-table-${this.playerId}-line-1`).addEventListener('click', () => this.game.selectLine(0));
        if (this.game.getBoardNumber()) {
            for (let line=1; line<=5; line++) {
                for (let column=1; column<=5; column++) {
                    document.getElementById(`player-table-${this.playerId}-wall-spot-${line}-${column}`).addEventListener('click', () => {
                        this.game.selectColumn(line, column);
                    });
                }
            }
            document.getElementById(`player-table-${this.playerId}-column0`).addEventListener('click', () => this.game.selectColumn(0, 0));
        }

        for (let i=-1; i<=5; i++) {
            const tiles = player.lines.filter(tile => tile.line === i);
            this.placeTilesOnLine(tiles, i);
        }

        this.placeTilesOnWall(player.wall);

        
        if (this.game.getBoardNumber()) {
            // if player hit refresh when column is selected but not yet applied, we reset ghost tile
            if (this.playerId === this.game.getPlayerId()) {
                player.selectedColumns.forEach(selectedColumn => this.setGhostTile(selectedColumn.line, selectedColumn.column, selectedColumn.color));
            }
        }
    }

    public placeTilesOnHand(tiles: Tile[], temporarilyRemoveOverflow: boolean = false, newAnimation: boolean = false) {
        if (!tiles?.length) {
            return Promise.resolve();
        }

        const startX = HAND_CENTER - tiles.length * (HALF_TILE_SIZE + 5);
        const line0 = temporarilyRemoveOverflow ? document.getElementById(`player-table-${this.playerId}-line0`) : null;
        if (temporarilyRemoveOverflow) {
            line0.style.overflow = 'unset';
        }
        Promise.all(tiles.map((tile, index) => this.game.placeTile(tile, `player-hand-${this.playerId}`, startX + (tiles.length - index) * (HALF_TILE_SIZE + 5) * 2, 5, undefined, newAnimation))).then(() => {
            if (temporarilyRemoveOverflow) {
                line0.style.overflow = null;
            }
        });
        this.setHandVisible(tiles.length > 0);
    }

    public placeTilesOnLine(tiles: Tile[], line: number, temporarilyRemoveOverflow: boolean = false, newAnimation: boolean = false): Promise<any> {
        if (!tiles?.length) {
            return Promise.resolve();
        }

        const lineId = `player-table-${this.playerId}-line${line}`;
        const line0 = temporarilyRemoveOverflow ? document.getElementById(lineId) : null;
        if (temporarilyRemoveOverflow) {
            line0.style.overflow = 'unset';
        }
        return Promise.all(tiles.map(tile => {
            const left = line == -1 ? 9 : (line > 0 ? (line - tile.column) * 69 : 5 + (tile.column-1) * 74);
            const top = line == -1 ? 9 : 0;
            return this.game.placeTile(tile, lineId, left, top, undefined, newAnimation);
        })).then(() => {
            if (temporarilyRemoveOverflow) {
                line0.style.overflow = null;
            }
        });
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
    
    public setOwnSpecialFactoryZero(own: boolean) {
        document.getElementById(`player-table-${this.playerId}`).dataset.specialFactoryZeroOwned = own.toString();
    }
}