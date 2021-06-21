class PlayerTable {
    private playerId: number;

    constructor(
        private game: AzulGame, 
        player: Player) {

        this.playerId = Number(player.id);

        dojo.place(`<div id="player-table-wrapper-${this.playerId}">
            <div class="player-name" style="color: #${player.color};">
                ${player.name}
            </div>
            <div id="player-table-${this.playerId}" class="player-table">
            </div>
        </div>`, 'players-tables');
    }
}