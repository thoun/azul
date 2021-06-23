const FACTORY_RADIUS = 125;

class Factories {
    constructor(
        private game: AzulGame, 
        private factoryNumber: number,
        factories: { [factoryId: number]: Tile[] }
    ) {
        const factoriesDiv = document.getElementById('factories');

        const radius = 40 + factoryNumber*40;
        const centerX = factoriesDiv.clientWidth / 2;
        const centerY = radius + FACTORY_RADIUS;
        factoriesDiv.style.height = `${centerY*2}px`;

        let html = `<div>`;
        html += `<div id="factory0" class="factory-center" style="left: ${centerX-radius+FACTORY_RADIUS}px; top: ${centerY-radius+FACTORY_RADIUS}px; width: ${radius-FACTORY_RADIUS}px; height: ${radius-FACTORY_RADIUS}px;"></div>`;
        for (let i=1; i<=factoryNumber; i++) {
            const angle = (i-1)*Math.PI*2/factoryNumber; // in radians
            const left = radius*Math.sin(angle);
            const top = radius*Math.cos(angle);
            
            html += `<div id="factory${i}" class="factory" style="left: ${centerX-FACTORY_RADIUS+left}px; top: ${centerY-FACTORY_RADIUS-top}px;"></div>`;
        }
        html += `</div>`;

        dojo.place(html, 'factories');

        this.fillFactories(factories);
    }

    public fillFactories(factories: { [factoryId: number]: Tile[]; }) {
        for (let i=0; i<=this.factoryNumber; i++) {
            const factory = factories[i];
            factory.forEach((tile, index) => {
                dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="left: ${50 + Math.floor(index / 2) * 90}px; top: ${50 + Math.floor(index % 2) * 90}px;"></div>`, `factory${i}`);

                document.getElementById(`tile${tile.id}`).addEventListener('click', () => this.game.takeTiles(tile.id));
            });
        }
    }

    public moveSelectedTiles(selectedTiles: Tile[], discardedTiles: Tile[]) {
        selectedTiles.forEach(tile => (this.game as any).slideToObjectAndDestroy($(`tile${tile.id}`), 'topbar'));
        discardedTiles.forEach(tile => slideToObjectAndAttach(this.game, $(`tile${tile.id}`), 'factory0'));
    }
}