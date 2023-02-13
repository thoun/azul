const FACTORY_RADIUS = 125;
const HALF_TILE_SIZE = 29;
const CENTER_FACTORY_TILE_SHIFT = 12;

class Factories {
    private tilesPositionsInCenter: PlacedTile[][] = [[], [], [], [], [], []]; // color, tiles
    private tilesInFactories: Tile[][][] = []; // factory, color, tiles
    bagCounter: Counter;

    constructor(
        private game: AzulGame, 
        private factoryNumber: number,
        factories: { [factoryId: number]: Tile[] },
        remainingTiles: number,
        specialFactories?: { [factoryNumber: number]: number }
    ) {
        const factoriesDiv = document.getElementById('factories');

        const radius = 175 + factoryNumber*25;
        const halfSize = radius + FACTORY_RADIUS;
        const size = `${halfSize*2}px`;
        factoriesDiv.style.width = size;
        factoriesDiv.style.height = '1135px';
        const heightShift = (1135 - halfSize*2) / 2 + 35;

        const bagDiv = document.getElementById('bag');
        factoriesDiv.style.setProperty('--top', `${heightShift}px`);
        this.bagCounter = new ebg.counter();
        this.bagCounter.create('bag-counter');
        bagDiv.addEventListener('click', () => dojo.toggleClass('bag-counter', 'visible'));

        let html = `<div>`;
        html += `<div id="factory0" class="factory-center"></div>`;
        for (let i=1; i<=factoryNumber; i++) {
            const angle = (i-1)*Math.PI*2/factoryNumber; // in radians
            const left = radius*Math.sin(angle);
            const top = radius*Math.cos(angle);
            
            html += `<div id="factory${i}" class="factory" style="left: ${halfSize-FACTORY_RADIUS+left}px; top: ${heightShift + halfSize-FACTORY_RADIUS-top}px;"
            ${specialFactories?.[i] ? ` data-special-factory="${specialFactories[i]}"` : ``}
            ></div>`;
        }
        html += `</div>`;

        dojo.place(html, 'factories');

        for (let factoryIndex=1; factoryIndex<=this.factoryNumber; factoryIndex++) {
            document.getElementById(`factory${factoryIndex}`).addEventListener('click', () => this.game.selectFactory(factoryIndex));
        }

        this.fillFactories(factories, remainingTiles, false);
    }

    public getWidth(): number {        
        const radius = 175 + this.factoryNumber*25;
        const halfSize = radius + FACTORY_RADIUS;
        return halfSize*2;
    }

    public centerColorRemoved(color: number) {
        this.tilesInFactories[0][color] = [];
        this.tilesPositionsInCenter[color] = [];

        this.updateDiscardedTilesNumbers();
    }

    public factoryTilesRemoved(factory: number) {
        this.tilesInFactories[factory] = [[], [], [], [], [], []];
    }

    private getCoordinatesInFactory(tileIndex: number, tileNumber: number) {
        const angle = tileIndex*Math.PI*2/tileNumber - Math.PI/4; // in radians

        return {
            left: 125 + 70*Math.sin(angle) - HALF_TILE_SIZE,
            top: 125 + 70*Math.cos(angle) - HALF_TILE_SIZE,
        };
        /*return {
            left: 50 + Math.floor(tileIndex / 2) * 90,
            top: 50 + Math.floor(tileIndex % 2) * 90,
        };*/
    }

    public getCoordinatesForTile0() {
        const centerFactoryDiv = document.getElementById('factory0');
        return {
            left: centerFactoryDiv.clientWidth / 2 - HALF_TILE_SIZE,
            top: centerFactoryDiv.clientHeight / 2,
        };
    }

    public fillFactories(factories: { [factoryId: number]: Tile[]; }, remainingTiles: number, animation: boolean = true) {
        let tileIndex = 0;
        for (let factoryIndex=0; factoryIndex<=this.factoryNumber; factoryIndex++) {
            this.tilesInFactories[factoryIndex] = [[], [], [], [], [], []]; // color, tiles
            const factoryTiles = factories[factoryIndex];
            factoryTiles.forEach((tile, index) => {
                let left = null;
                let top = null;
                if (factoryIndex > 0) {
                    const coordinates = this.getCoordinatesInFactory(index, factoryTiles.length);
                    left = coordinates.left;
                    top = coordinates.top;
                } else {
                    if (tile.type == 0) {
                        const coordinates = this.getCoordinatesForTile0();
                        left = coordinates.left;
                        top = coordinates.top;
                    } else {
                        const coords = this.getFreePlaceForFactoryCenter(tile.type);
                        left = coords.left;
                        top = coords.top;

                        this.tilesPositionsInCenter[tile.type].push({ id: tile.id, x: left, y: top });
                    }
                }
                this.tilesInFactories[factoryIndex][tile.type].push(tile);
                if (tile.type == 0) {
                    this.game.placeTile(tile, `factory${factoryIndex}`, left, top);
                } else {
                    const delay = animation ? tileIndex * 80 : 0;
                    setTimeout(() => {
                        this.game.placeTile(tile, `bag`, 20, 20, 0);
                        slideToObjectAndAttach(this.game, document.getElementById(`tile${tile.id}`), `factory${factoryIndex}`, left, top, Math.round(Math.random()*90 - 45));
                    }, delay);
                    tileIndex++;
                }
            });
        }

        this.updateDiscardedTilesNumbers();
        this.setRemainingTiles(remainingTiles);
    }

    public factoriesChanged(args: NotifFactoriesChangedArgs) {
        const factoryTiles = args.factories[args.factory];
        args.tiles.forEach(newTile => {
            const index = factoryTiles.findIndex(tile => tile.id == newTile.id);
            const coordinates = this.getCoordinatesInFactory(index, factoryTiles.length);
            const left = coordinates.left;
            const top = coordinates.top;
            slideToObjectAndAttach(this.game, document.getElementById(`tile${newTile.id}`), `factory${args.factory}`, left, top, Math.round(Math.random()*90 - 45));

            this.updateTilesInFactories(args.tiles, args.factory);
        });

        factoryTiles.forEach((tile, index) => {
            const coordinates = this.getCoordinatesInFactory(index, factoryTiles.length);
            const left = coordinates.left;
            const top = coordinates.top;
            const tileDiv = document.getElementById(`tile${tile.id}`);
            tileDiv.style.left = `${left}px`;
            tileDiv.style.top = `${top}px`;
        });
    }
    
    public factoriesCompleted(args: NotifFactoriesChangedArgs) {
        const factoryTiles = args.factories[args.factory];
            factoryTiles.forEach((tile, index) => {
                const coordinates = this.getCoordinatesInFactory(index, factoryTiles.length);
                const left = coordinates.left;
                const top = coordinates.top;
                const tileDiv = document.getElementById(`tile${tile.id}`);
                if (tileDiv) {
                    tileDiv.style.left = `${left}px`;
                    tileDiv.style.top = `${top}px`;
                } else {
                    this.game.placeTile(tile, `factory${args.factory}`, left, top);
                }
            });
            this.updateTilesInFactories(factoryTiles, args.factory);
    }
    
    private updateTilesInFactories(tiles: Tile[], factory: number) {
        tiles.forEach(tile => {
            let oldFactory = this.tilesInFactories.findIndex(f => f[tile.type].some(t => t.id == tile.id));
            if (oldFactory != factory) {
                this.tilesInFactories[factory][tile.type].push(tile);
                if (oldFactory !== -1) {
                    const oldIndex = this.tilesInFactories[oldFactory][tile.type].findIndex(t => t.id == tile.id);
                    if (oldIndex !== -1) {
                        this.tilesInFactories[oldFactory][tile.type].splice(oldIndex, 1);
                    }
                }
            }
        });
    }

    public discardTiles(discardedTiles: Tile[]) {
        const promise = discardedTiles.map(tile => {
            const {left, top} = this.getFreePlaceForFactoryCenter(tile.type);
            this.tilesInFactories[0][tile.type].push(tile);
            this.tilesPositionsInCenter[tile.type].push({ id: tile.id, x: left, y: top });
            const tileDiv = document.getElementById(`tile${tile.id}`);
            const rotation = tileDiv ? Number(tileDiv.dataset.rotation || 0) : 0;
            return this.game.placeTile(tile, 'factory0', left, top, rotation + Math.round(Math.random()*20 - 10));
        });

        setTimeout(() => this.updateDiscardedTilesNumbers(), ANIMATION_MS);

        return promise;
    }

    private getDistance(p1: PlacedTile, p2: PlacedTile): number {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    private setRandomCoordinates(newPlace: PlacedTile, xCenter: number, yCenter: number, radius: number, color: number) {
        const angle = (0.3 + color/5 + Math.random()/4)*Math.PI*2;
        const distance = Math.random()*radius;
        newPlace.x = xCenter - HALF_TILE_SIZE - distance*Math.sin(angle);
        newPlace.y = yCenter - distance*Math.cos(angle);
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
        
        let place = { x: 0, y: HALF_TILE_SIZE};
        this.setRandomCoordinates(place, xCenter, yCenter, radius, color);
        let minDistance = this.getMinDistance(placedTiles, place);
        let protection = 0;
        while (protection < 1000 && minDistance < HALF_TILE_SIZE*2) {
            const newPlace = { x: 0, y: HALF_TILE_SIZE};
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
            y: yCenter,
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

                const newNumberDiv = document.getElementById(`tileCount${type}`);
                const firstTileId = this.tilesInFactories[0][type][0].id;
                newNumberDiv.addEventListener('click', () => this.game.takeTiles(firstTileId));
                newNumberDiv.addEventListener('mouseenter', () => this.tileMouseEnter(firstTileId));
                newNumberDiv.addEventListener('mouseleave', () => this.tileMouseLeave(firstTileId));
            }
        }
    }

    private getTilesOfSameColorInSameFactory(id: number): Tile[] {
        for (const tilesInFactory of this.tilesInFactories) {
            for (const colorTilesInFactory of tilesInFactory) {
                if (colorTilesInFactory.some(tile => tile.id === id)) {
                    return colorTilesInFactory;
                }
            }
        }
        return null;
    }

    public tileMouseEnter(id: number) {
        const tiles = this.getTilesOfSameColorInSameFactory(id);
        if (tiles?.length && this.tilesInFactories[0].some(tilesOfColor => tilesOfColor.some(tile => tile.id == id))) {
            document.getElementById(`tileCount${tiles[0].type}`)?.classList.add('hover');
        }
        tiles?.forEach(tile => {
            document.getElementById(`tile${tile.id}`).classList.add('hover');
        });
    }

    public tileMouseLeave(id: number) {
        const tiles = this.getTilesOfSameColorInSameFactory(id);
        if (tiles?.length) {
            document.getElementById(`tileCount${tiles[0].type}`)?.classList.remove('hover');
        }
        tiles?.forEach(tile => {
            document.getElementById(`tile${tile.id}`).classList.remove('hover');
        });
    }

    public undoTakeTiles(tiles: Tile[], from: number, factoryTilesBefore: Tile[]): Promise<any> {
        let promise;
        if (from > 0) {
            const countBefore = factoryTilesBefore?.length ?? 0;
            const count = countBefore + tiles.length;
            if (factoryTilesBefore?.length) {
                factoryTilesBefore.forEach((tile, index) => {
                    const coordinates = this.getCoordinatesInFactory(index, count);
                    const left = coordinates.left;
                    const top = coordinates.top;
                    const tileDiv = document.getElementById(`tile${tile.id}`);
                    tileDiv.style.left = `${left}px`;
                    tileDiv.style.top = `${top}px`;
                });
            }

            promise = Promise.all(tiles.map((tile, index) => {
                const coordinates = this.getCoordinatesInFactory(countBefore + index, count);
                this.tilesInFactories[from][tile.type].push(tile);


                const centerIndex = this.tilesInFactories[0][tile.type].findIndex(t => tile.id == t.id);
                if (centerIndex !== -1) {
                    this.tilesInFactories[0][tile.type].splice(centerIndex, 1);
                }
                const centerCoordIndex = this.tilesPositionsInCenter[tile.type].findIndex(t => tile.id == t.id);
                if (centerCoordIndex !== -1) {
                    this.tilesPositionsInCenter[tile.type].splice(centerCoordIndex, 1);
                }

                return this.game.placeTile(tile, `factory${from}`, coordinates.left, coordinates.top, Math.round(Math.random()*90 - 45));
            }));
        } else {
            const promises = this.discardTiles(tiles.filter(tile => tile.type > 0));
            const tile0 = tiles.find(tile => tile.type == 0);
            if (tile0) {
                const coordinates = this.getCoordinatesForTile0();
                promises.push(
                    this.game.placeTile(tile0, `factory0`, coordinates.left, coordinates.top)
                ); 
            }
            promise = Promise.all(promises);
            
        }

        setTimeout(() => this.updateDiscardedTilesNumbers(), ANIMATION_MS);
        return promise;
    }

    private setRemainingTiles(remainingTiles: number) {
        this.bagCounter.setValue(remainingTiles);
    }
}