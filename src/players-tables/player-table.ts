class PlayerTable {
    private playerId: number;

    constructor(
        private game: AzulGame, 
        player: Player) {

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
        html += `    </div>
        </div>`;

        dojo.place(html, 'players-tables');

        for (let i=0; i<=5; i++) {
            document.getElementById(`player-table-${this.playerId}-line${i}`).addEventListener('click', () => this.game.selectLine(i));
        }
    }
}