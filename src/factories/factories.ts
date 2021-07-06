const FACTORY_RADIUS = 125;
const HALF_TILE_SIZE = 29;

class Factories {
    constructor(
        private game: AzulGame, 
        private factoryNumber: number,
        factories: { [factoryId: number]: Tile[] }
    ) {
        const factoriesDiv = document.getElementById('factories');

        const radius = 130 + factoryNumber*30;
        const halfSize = radius + FACTORY_RADIUS;
        const size = `${halfSize*2}px`;
        factoriesDiv.style.width = size;
        factoriesDiv.style.height = size;

        let html = `<div>`;
        html += `<div id="factory0" class="factory-center"></div>`;
        for (let i=1; i<=factoryNumber; i++) {
            const angle = (i-1)*Math.PI*2/factoryNumber; // in radians
            const left = radius*Math.sin(angle);
            const top = radius*Math.cos(angle);
            
            html += `<div id="factory${i}" class="factory" style="left: ${halfSize-FACTORY_RADIUS+left}px; top: ${halfSize-FACTORY_RADIUS-top}px;"></div>`;
        }
        html += `</div>`;

        dojo.place(html, 'factories');

        this.fillFactories(factories);
    }

    public getWidth(): number {        
        const radius = 130 + this.factoryNumber*30;
        const halfSize = radius + FACTORY_RADIUS;
        return halfSize*2;
    }

    public fillFactories(factories: { [factoryId: number]: Tile[]; }) {
        for (let i=0; i<=this.factoryNumber; i++) {
            const factory = factories[i];
            factory.forEach((tile, index) => {
                let left = null;
                let top = null;
                if (i > 0) {
                    left = 50 + Math.floor(index / 2) * 90;
                    top = 50 + Math.floor(index % 2) * 90;
                } else {
                    if (tile.type == 0) {
                        const centerFactoryDiv = document.getElementById('factory0');
                        left = centerFactoryDiv.clientWidth / 2 - HALF_TILE_SIZE;
                        top = centerFactoryDiv.clientHeight / 2 - HALF_TILE_SIZE;
                    } else {
                        const coords = this.getFreePlaceForFactoryCenter();
                        left = coords.left;
                        top = coords.top;
                    }
                }
                this.game.placeTile(tile, `factory${i}`, left, top);

                document.getElementById(`tile${tile.id}`).addEventListener('click', () => this.game.takeTiles(tile.id));
            });
        }
    }

    private getFreePlaceForFactoryCenter():  {left: number, top: number} {
        const centerFactoryDiv = document.getElementById('factory0');
        const xCenter = centerFactoryDiv.clientWidth / 2;
        const yCenter = centerFactoryDiv.clientHeight / 2;
        const left = xCenter + Math.round(Math.random()* 120)-60;
        const top = yCenter + Math.round(Math.random()* 120)-60;
        return {left, top};
    }

    public moveSelectedTiles(selectedTiles: Tile[], discardedTiles: Tile[], playerId: number) {
        selectedTiles.forEach(tile => slideToObjectAndAttach(this.game, $(`tile${tile.id}`), `player_board_${playerId}`));
        discardedTiles.forEach(tile => {
            const {left, top} = this.getFreePlaceForFactoryCenter();
            this.game.placeTile(tile, 'factory0', left, top);
        });
        //selectedTiles.forEach(tile => (this.game as any).slideToObjectAndDestroy($(`tile${tile.id}`), 'topbar'));
        //discardedTiles.forEach(tile => slideToObjectAndAttach(this.game, $(`tile${tile.id}`), 'factory0'));
    }
}