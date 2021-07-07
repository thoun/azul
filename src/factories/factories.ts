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
                        const coords = this.getFreePlaceForFactoryCenter(tile.type);
                        left = coords.left;
                        top = coords.top;
                    }
                }
                this.game.placeTile(tile, `factory${i}`, left, top);

                document.getElementById(`tile${tile.id}`).addEventListener('click', () => this.game.takeTiles(tile.id));
            });
        }
    }

    public moveSelectedTiles(selectedTiles: Tile[], discardedTiles: Tile[], playerId: number) {
        selectedTiles.forEach(tile => slideToObjectAndAttach(this.game, $(`tile${tile.id}`), `player-hand-${playerId}`));
        discardedTiles.forEach(tile => {
            const {left, top} = this.getFreePlaceForFactoryCenter(tile.type);
            this.game.placeTile(tile, 'factory0', left, top);
        });
        //selectedTiles.forEach(tile => (this.game as any).slideToObjectAndDestroy($(`tile${tile.id}`), 'topbar'));
        //discardedTiles.forEach(tile => slideToObjectAndAttach(this.game, $(`tile${tile.id}`), 'factory0'));
    }

    

    private getDistance(p1: PlacedTile, p2: PlacedTile): number {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    private setRandomCoordinates(newPlace: PlacedTile, xCenter: number, yCenter: number, radius: number, color: number) {
        const angle = (0.3 + color/5 + Math.random()/4)*Math.PI*2;
        const distance = Math.random()*radius;
        newPlace.x = xCenter - HALF_TILE_SIZE - distance*Math.sin(angle);
        newPlace.y = yCenter - HALF_TILE_SIZE - distance*Math.cos(angle);
    }

    private getFreePlaceCoordinatesForFactoryCenter(placedTiles: PlacedTile[], xCenter: number, yCenter: number, color: number): PlacedTile {
        const radius = 130 + this.factoryNumber*30 - 165;
        
        const newPlace = { x: 0, y: 0};
        this.setRandomCoordinates(newPlace, xCenter, yCenter, radius, color);
        let protection = 0;
        while (protection < 1000 && placedTiles.some(place => this.getDistance(newPlace, place) < HALF_TILE_SIZE*2)) {
            this.setRandomCoordinates(newPlace, xCenter, yCenter, radius, color);
            protection++;
        }
        console.log('protection', protection);

        return newPlace;
    }

    public getFreePlaceForFactoryCenter(color: number): {left: number, top: number} {
        const div = document.getElementById('factory0');
        const xCenter = div.clientWidth / 2;
        const yCenter = div.clientHeight / 2;

        const placed: PlacedTile[] = div.dataset.placed ? JSON.parse(div.dataset.placed) : [{ // we init with first player tile
            x: xCenter - HALF_TILE_SIZE,
            y: yCenter - HALF_TILE_SIZE,
        }];

        const newPlace = this.getFreePlaceCoordinatesForFactoryCenter(placed, xCenter, yCenter, color);
        placed.push(newPlace);

        div.dataset.placed = JSON.stringify(placed);

        return {
            left: newPlace.x,
            top: newPlace.y,
        };
    }
}