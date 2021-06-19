class PlayerTable {
    private playerId: number;

    constructor(
        private game: AzulGame, 
        player: Player) {

        this.playerId = Number(player.id);

        dojo.place(`<div id="player-table-wrapper-${this.playerId}" class="player-table-wrapper">
            <div id="player-table-mat-${this.playerId}" class="player-table-mat mat${(player as any).mat}">
                <div id="player-table-${this.playerId}" class="player-table">
                    <div class="player-name mat${(player as any).mat}" style="color: #${player.color};">
                        ${player.name}
                    </div>
                </div>
            </div>
        </div>`, 'players-tables');
    }
}