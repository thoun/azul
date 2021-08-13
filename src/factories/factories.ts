const FACTORY_RADIUS = 125;
const HALF_TILE_SIZE = 29;
const CENTER_FACTORY_TILE_SHIFT = 12;

class Factories {
    private tilesInCenter: Tile[][] = [[], [], [], [], [], []];
    private tilesPositionsInCenter: PlacedTile[][] = [[], [], [], [], [], []];

    constructor(
        private game: AzulGame, 
        private factoryNumber: number,
        factories: { [factoryId: number]: Tile[] }
    ) {
        const factoriesDiv = document.getElementById('factories');

        const radius = 175 + factoryNumber*25;
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
        const radius = 175 + this.factoryNumber*25;
        const halfSize = radius + FACTORY_RADIUS;
        return halfSize*2;
    }

    public centerColorRemoved(color: number) {
        this.tilesInCenter[color] = [];
        this.tilesPositionsInCenter[color] = [];

        this.updateDiscardedTilesNumbers();
    }

    public fillFactories(factories: { [factoryId: number]: Tile[]; }) {
        for (let factoryIndex=0; factoryIndex<=this.factoryNumber; factoryIndex++) {
            const factoryTiles = factories[factoryIndex];
            factoryTiles.forEach((tile, index) => {
                let left = null;
                let top = null;
                if (factoryIndex > 0) {
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
                        this.tilesInCenter[tile.type].push(tile);
                        this.tilesPositionsInCenter[tile.type].push({ x: left, y: top });
                    }
                }
                this.game.placeTile(tile, `factory${factoryIndex}`, left, top, tile.type != 0 ? Math.round(Math.random()*90 - 45) : undefined);

                document.getElementById(`tile${tile.id}`).addEventListener('click', () => this.game.takeTiles(tile.id));
            });
        }

        this.updateDiscardedTilesNumbers();
    }

    public discardTiles(discardedTiles: Tile[]) {
        discardedTiles.forEach(tile => {
            const {left, top} = this.getFreePlaceForFactoryCenter(tile.type);
            this.tilesInCenter[tile.type].push(tile);
            this.tilesPositionsInCenter[tile.type].push({ x: left, y: top });
            const rotation = Number(document.getElementById(`tile${tile.id}`).dataset.rotation);
            this.game.placeTile(tile, 'factory0', left, top, rotation + Math.round(Math.random()*20 - 10));
        });

        setTimeout(() => this.updateDiscardedTilesNumbers(), ANIMATION_MS);
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

    private getMinDistance(placedTiles: PlacedTile[], newPlace: PlacedTile): number {
        if (!placedTiles.length) {
            return 999;
        }
        const distances = placedTiles.map(place => this.getDistance(newPlace, place));
        if (distances.length == 1) {
            return distances[0];
        }
        return distances.reduce((a, b) => a < b ? a : b);
    }

    private getFreePlaceCoordinatesForFactoryCenter(placedTiles: PlacedTile[], xCenter: number, yCenter: number, color: number): PlacedTile {
        const radius = 175 + this.factoryNumber*25 - 165;
        
        let place = { x: 0, y: 0};
        this.setRandomCoordinates(place, xCenter, yCenter, radius, color);
        let minDistance = this.getMinDistance(placedTiles, place);
        let protection = 0;
        while (protection < 1000 && minDistance < HALF_TILE_SIZE*2) {
            const newPlace = { x: 0, y: 0};
            this.setRandomCoordinates(newPlace, xCenter, yCenter, radius, color);
            const newMinDistance = this.getMinDistance(placedTiles, newPlace);
            if (newMinDistance > minDistance) {
                place = newPlace;
                minDistance = newMinDistance;
            }
            protection++;
        }

        return place;
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

    private updateDiscardedTilesNumbers() {
        for (let type=1; type<=5; type++) {
            const number = this.tilesPositionsInCenter[type].length;

            const numberDiv = document.getElementById(`tileCount${type}`);

            if (!number) {
                numberDiv?.parentElement.removeChild(numberDiv);
                continue;
            }

            // TODO
            const x = this.tilesPositionsInCenter[type].reduce((sum, place) => sum + place.x, 0) / number + 14;
            const y = this.tilesPositionsInCenter[type].reduce((sum, place) => sum + place.y, 0) / number + 14;
            if (numberDiv) {
                numberDiv.style.left = `${x}px`;
                numberDiv.style.top = `${y}px`;
                numberDiv.innerHTML = ''+number;
            } else {
                dojo.place(`
                <div id="tileCount${type}" class="tile-count tile${type}" style="left: ${x}px; top: ${y}px;">${number}</div>
                `, 'factories');

                document.getElementById(`tileCount${type}`).addEventListener('click', () => this.game.takeTiles(this.tilesInCenter[type][0].id))
            }
        }
    }
}