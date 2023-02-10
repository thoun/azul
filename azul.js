var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this.zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', function () { return _this.zoomOrDimensionChanged(); });
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        window.addEventListener('resize', function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        });
        if (window.ResizeObserver) {
            new ResizeObserver(function () { return _this.zoomOrDimensionChanged(); }).observe(settings.element);
        }
        if ((_e = this.settings.autoZoom) === null || _e === void 0 ? void 0 : _e.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this.zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this.zoomLevels[this.zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this.zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.getBoundingClientRect().width / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.getBoundingClientRect().height, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this.zoomLevels[this.zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this.zoomLevels[0]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
function slideToObjectAndAttach(game, object, destinationId, posX, posY, rotation) {
    if (rotation === void 0) { rotation = 0; }
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
        var originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';
        var objectCR = object.getBoundingClientRect();
        var destinationCR = destination.getBoundingClientRect();
        var deltaX = destinationCR.left - objectCR.left + (posX !== null && posX !== void 0 ? posX : 0) * game.getZoom();
        var deltaY = destinationCR.top - objectCR.top + (posY !== null && posY !== void 0 ? posY : 0) * game.getZoom();
        var attachToNewParent = function () {
            object.style.top = posY !== undefined ? "".concat(posY, "px") : 'unset';
            object.style.left = posX !== undefined ? "".concat(posX, "px") : 'unset';
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            object.style.zIndex = originalZIndex ? '' + originalZIndex : 'unset';
            object.style.transform = rotation ? "rotate(".concat(rotation, "deg)") : 'unset';
            object.style.transition = null;
            destination.appendChild(object);
        };
        if (document.visibilityState === 'hidden' || game.instantaneousMode) {
            // if tab is not visible, we skip animation (else they could be delayed or cancelled by browser)
            attachToNewParent();
        }
        else {
            object.style.transition = "transform 0.5s ease-in";
            object.style.transform = "translate(".concat(deltaX / game.getZoom(), "px, ").concat(deltaY / game.getZoom(), "px) rotate(").concat(rotation, "deg)");
            var securityTimeoutId_1 = null;
            var transitionend_1 = function () {
                attachToNewParent();
                object.removeEventListener('transitionend', transitionend_1);
                object.removeEventListener('transitioncancel', transitionend_1);
                resolve(true);
                if (securityTimeoutId_1) {
                    clearTimeout(securityTimeoutId_1);
                }
            };
            object.addEventListener('transitionend', transitionend_1);
            object.addEventListener('transitioncancel', transitionend_1);
            // security check : if transition fails, we force tile to destination
            securityTimeoutId_1 = setTimeout(function () {
                if (!destination.contains(object)) {
                    attachToNewParent();
                    object.removeEventListener('transitionend', transitionend_1);
                    object.removeEventListener('transitioncancel', transitionend_1);
                    resolve(true);
                }
            }, 700);
        }
    });
}
var FACTORY_RADIUS = 125;
var HALF_TILE_SIZE = 29;
var CENTER_FACTORY_TILE_SHIFT = 12;
var Factories = /** @class */ (function () {
    function Factories(game, factoryNumber, factories, remainingTiles, specialFactories) {
        this.game = game;
        this.factoryNumber = factoryNumber;
        this.tilesPositionsInCenter = [[], [], [], [], [], []]; // color, tiles
        this.tilesInFactories = []; // factory, color, tiles
        var factoriesDiv = document.getElementById('factories');
        var radius = 175 + factoryNumber * 25;
        var halfSize = radius + FACTORY_RADIUS;
        var size = "".concat(halfSize * 2, "px");
        factoriesDiv.style.width = size;
        factoriesDiv.style.height = '1135px';
        var heightShift = (1135 - halfSize * 2) / 2 + 35;
        var bagDiv = document.getElementById('bag');
        factoriesDiv.style.setProperty('--top', "".concat(heightShift, "px"));
        this.bagCounter = new ebg.counter();
        this.bagCounter.create('bag-counter');
        bagDiv.addEventListener('click', function () { return dojo.toggleClass('bag-counter', 'visible'); });
        var html = "<div>";
        html += "<div id=\"factory0\" class=\"factory-center\"></div>";
        for (var i = 1; i <= factoryNumber; i++) {
            var angle = (i - 1) * Math.PI * 2 / factoryNumber; // in radians
            var left = radius * Math.sin(angle);
            var top_1 = radius * Math.cos(angle);
            html += "<div id=\"factory".concat(i, "\" class=\"factory\" style=\"left: ").concat(halfSize - FACTORY_RADIUS + left, "px; top: ").concat(heightShift + halfSize - FACTORY_RADIUS - top_1, "px;\"\n            ").concat((specialFactories === null || specialFactories === void 0 ? void 0 : specialFactories[i]) ? " data-special-factory=\"".concat(specialFactories[i], "\"") : "", "\n            ></div>");
        }
        html += "</div>";
        dojo.place(html, 'factories');
        this.fillFactories(factories, remainingTiles, false);
    }
    Factories.prototype.getWidth = function () {
        var radius = 175 + this.factoryNumber * 25;
        var halfSize = radius + FACTORY_RADIUS;
        return halfSize * 2;
    };
    Factories.prototype.centerColorRemoved = function (color) {
        this.tilesInFactories[0][color] = [];
        this.tilesPositionsInCenter[color] = [];
        this.updateDiscardedTilesNumbers();
    };
    Factories.prototype.factoryTilesRemoved = function (factory) {
        this.tilesInFactories[factory] = [[], [], [], [], [], []];
    };
    Factories.prototype.getCoordinatesInFactory = function (tileIndex, tileNumber) {
        var angle = tileIndex * Math.PI * 2 / tileNumber - Math.PI / 4; // in radians
        return {
            left: 125 + 70 * Math.sin(angle) - HALF_TILE_SIZE,
            top: 125 + 70 * Math.cos(angle) - HALF_TILE_SIZE,
        };
        /*return {
            left: 50 + Math.floor(tileIndex / 2) * 90,
            top: 50 + Math.floor(tileIndex % 2) * 90,
        };*/
    };
    Factories.prototype.getCoordinatesForTile0 = function () {
        var centerFactoryDiv = document.getElementById('factory0');
        return {
            left: centerFactoryDiv.clientWidth / 2 - HALF_TILE_SIZE,
            top: centerFactoryDiv.clientHeight / 2,
        };
    };
    Factories.prototype.fillFactories = function (factories, remainingTiles, animation) {
        var _this = this;
        if (animation === void 0) { animation = true; }
        var tileIndex = 0;
        var _loop_1 = function (factoryIndex) {
            this_1.tilesInFactories[factoryIndex] = [[], [], [], [], [], []]; // color, tiles
            var factoryTiles = factories[factoryIndex];
            factoryTiles.forEach(function (tile, index) {
                var left = null;
                var top = null;
                if (factoryIndex > 0) {
                    var coordinates = _this.getCoordinatesInFactory(index, factoryTiles.length);
                    left = coordinates.left;
                    top = coordinates.top;
                }
                else {
                    if (tile.type == 0) {
                        var coordinates = _this.getCoordinatesForTile0();
                        left = coordinates.left;
                        top = coordinates.top;
                    }
                    else {
                        var coords = _this.getFreePlaceForFactoryCenter(tile.type);
                        left = coords.left;
                        top = coords.top;
                        _this.tilesPositionsInCenter[tile.type].push({ id: tile.id, x: left, y: top });
                    }
                }
                _this.tilesInFactories[factoryIndex][tile.type].push(tile);
                if (tile.type == 0) {
                    _this.game.placeTile(tile, "factory".concat(factoryIndex), left, top);
                }
                else {
                    var delay = animation ? tileIndex * 80 : 0;
                    setTimeout(function () {
                        _this.game.placeTile(tile, "bag", 20, 20, 0);
                        slideToObjectAndAttach(_this.game, document.getElementById("tile".concat(tile.id)), "factory".concat(factoryIndex), left, top, Math.round(Math.random() * 90 - 45));
                    }, delay);
                    tileIndex++;
                }
            });
        };
        var this_1 = this;
        for (var factoryIndex = 0; factoryIndex <= this.factoryNumber; factoryIndex++) {
            _loop_1(factoryIndex);
        }
        this.updateDiscardedTilesNumbers();
        this.setRemainingTiles(remainingTiles);
    };
    Factories.prototype.factoriesChanged = function (args) {
        var _this = this;
        if (args.previousTile) {
            var index = args.factories[args.factory].findIndex(function (tile) { return tile.id == args.previousTile.id; });
            var coordinates = this.getCoordinatesInFactory(index, args.factories[args.factory].length);
            var left_1 = coordinates.left;
            var top_2 = coordinates.top;
            slideToObjectAndAttach(this.game, document.getElementById("tile".concat(args.previousTile.id)), "factory".concat(args.factory), left_1, top_2, Math.round(Math.random() * 90 - 45));
            var factoryTiles_1 = args.factories[args.factory];
            factoryTiles_1.filter(function (tile) { var _a; return tile.id != ((_a = args.nextTile) === null || _a === void 0 ? void 0 : _a.id); }).forEach(function (tile, index) {
                var coordinates = _this.getCoordinatesInFactory(index, factoryTiles_1.length);
                left_1 = coordinates.left;
                top_2 = coordinates.top;
                var tileDiv = document.getElementById("tile".concat(tile.id));
                tileDiv.style.left = "".concat(left_1, "px");
                tileDiv.style.top = "".concat(top_2, "px");
            });
        }
        if (args.nextTile) {
            var index = args.factories[args.factory].findIndex(function (tile) { return tile.id == args.nextTile.id; });
            var coordinates = this.getCoordinatesInFactory(index, args.factories[args.factory].length);
            var left_2 = coordinates.left;
            var top_3 = coordinates.top;
            slideToObjectAndAttach(this.game, document.getElementById("tile".concat(args.nextTile.id)), "factory".concat(args.factory), left_2, top_3, Math.round(Math.random() * 90 - 45));
            var factoryTiles_2 = args.factories[args.factory];
            factoryTiles_2.forEach(function (tile, index) {
                var coordinates = _this.getCoordinatesInFactory(index, factoryTiles_2.length);
                left_2 = coordinates.left;
                top_3 = coordinates.top;
                var tileDiv = document.getElementById("tile".concat(tile.id));
                tileDiv.style.left = "".concat(left_2, "px");
                tileDiv.style.top = "".concat(top_3, "px");
            });
        }
    };
    Factories.prototype.factoriesCompleted = function (args) {
        var _this = this;
        var factoryTiles = args.factories[args.factory];
        factoryTiles.forEach(function (tile, index) {
            var coordinates = _this.getCoordinatesInFactory(index, factoryTiles.length);
            var left = coordinates.left;
            var top = coordinates.top;
            var tileDiv = document.getElementById("tile".concat(tile.id));
            if (tileDiv) {
                tileDiv.style.left = "".concat(left, "px");
                tileDiv.style.top = "".concat(top, "px");
            }
            else {
                _this.game.placeTile(tile, "factory".concat(args.factory), left, top);
            }
        });
    };
    Factories.prototype.discardTiles = function (discardedTiles) {
        var _this = this;
        var promise = discardedTiles.map(function (tile) {
            var _a = _this.getFreePlaceForFactoryCenter(tile.type), left = _a.left, top = _a.top;
            _this.tilesInFactories[0][tile.type].push(tile);
            _this.tilesPositionsInCenter[tile.type].push({ id: tile.id, x: left, y: top });
            var tileDiv = document.getElementById("tile".concat(tile.id));
            var rotation = tileDiv ? Number(tileDiv.dataset.rotation || 0) : 0;
            return _this.game.placeTile(tile, 'factory0', left, top, rotation + Math.round(Math.random() * 20 - 10));
        });
        setTimeout(function () { return _this.updateDiscardedTilesNumbers(); }, ANIMATION_MS);
        return promise;
    };
    Factories.prototype.getDistance = function (p1, p2) {
        return Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
    };
    Factories.prototype.setRandomCoordinates = function (newPlace, xCenter, yCenter, radius, color) {
        var angle = (0.3 + color / 5 + Math.random() / 4) * Math.PI * 2;
        var distance = Math.random() * radius;
        newPlace.x = xCenter - HALF_TILE_SIZE - distance * Math.sin(angle);
        newPlace.y = yCenter - distance * Math.cos(angle);
    };
    Factories.prototype.getMinDistance = function (placedTiles, newPlace) {
        var _this = this;
        if (!placedTiles.length) {
            return 999;
        }
        var distances = placedTiles.map(function (place) { return _this.getDistance(newPlace, place); });
        if (distances.length == 1) {
            return distances[0];
        }
        return distances.reduce(function (a, b) { return a < b ? a : b; });
    };
    Factories.prototype.getFreePlaceCoordinatesForFactoryCenter = function (placedTiles, xCenter, yCenter, color) {
        var radius = 175 + this.factoryNumber * 25 - 165;
        var place = { x: 0, y: HALF_TILE_SIZE };
        this.setRandomCoordinates(place, xCenter, yCenter, radius, color);
        var minDistance = this.getMinDistance(placedTiles, place);
        var protection = 0;
        while (protection < 1000 && minDistance < HALF_TILE_SIZE * 2) {
            var newPlace = { x: 0, y: HALF_TILE_SIZE };
            this.setRandomCoordinates(newPlace, xCenter, yCenter, radius, color);
            var newMinDistance = this.getMinDistance(placedTiles, newPlace);
            if (newMinDistance > minDistance) {
                place = newPlace;
                minDistance = newMinDistance;
            }
            protection++;
        }
        return place;
    };
    Factories.prototype.getFreePlaceForFactoryCenter = function (color) {
        var div = document.getElementById('factory0');
        var xCenter = div.clientWidth / 2;
        var yCenter = div.clientHeight / 2;
        var placed = div.dataset.placed ? JSON.parse(div.dataset.placed) : [{
                x: xCenter - HALF_TILE_SIZE,
                y: yCenter,
            }];
        var newPlace = this.getFreePlaceCoordinatesForFactoryCenter(placed, xCenter, yCenter, color);
        placed.push(newPlace);
        div.dataset.placed = JSON.stringify(placed);
        return {
            left: newPlace.x,
            top: newPlace.y,
        };
    };
    Factories.prototype.updateDiscardedTilesNumbers = function () {
        var _this = this;
        var _loop_2 = function (type) {
            var number = this_2.tilesPositionsInCenter[type].length;
            var numberDiv = document.getElementById("tileCount".concat(type));
            if (!number) {
                numberDiv === null || numberDiv === void 0 ? void 0 : numberDiv.parentElement.removeChild(numberDiv);
                return "continue";
            }
            var x = this_2.tilesPositionsInCenter[type].reduce(function (sum, place) { return sum + place.x; }, 0) / number + 14;
            var y = this_2.tilesPositionsInCenter[type].reduce(function (sum, place) { return sum + place.y; }, 0) / number + 14;
            if (numberDiv) {
                numberDiv.style.left = "".concat(x, "px");
                numberDiv.style.top = "".concat(y, "px");
                numberDiv.innerHTML = '' + number;
            }
            else {
                dojo.place("\n                <div id=\"tileCount".concat(type, "\" class=\"tile-count tile").concat(type, "\" style=\"left: ").concat(x, "px; top: ").concat(y, "px;\">").concat(number, "</div>\n                "), 'factories');
                var newNumberDiv = document.getElementById("tileCount".concat(type));
                var firstTileId_1 = this_2.tilesInFactories[0][type][0].id;
                newNumberDiv.addEventListener('click', function () { return _this.game.takeTiles(firstTileId_1); });
                newNumberDiv.addEventListener('mouseenter', function () { return _this.tileMouseEnter(firstTileId_1); });
                newNumberDiv.addEventListener('mouseleave', function () { return _this.tileMouseLeave(firstTileId_1); });
            }
        };
        var this_2 = this;
        for (var type = 1; type <= 5; type++) {
            _loop_2(type);
        }
    };
    Factories.prototype.getTilesOfSameColorInSameFactory = function (id) {
        for (var _i = 0, _a = this.tilesInFactories; _i < _a.length; _i++) {
            var tilesInFactory = _a[_i];
            for (var _b = 0, tilesInFactory_1 = tilesInFactory; _b < tilesInFactory_1.length; _b++) {
                var colorTilesInFactory = tilesInFactory_1[_b];
                if (colorTilesInFactory.some(function (tile) { return tile.id === id; })) {
                    return colorTilesInFactory;
                }
            }
        }
        return null;
    };
    Factories.prototype.tileMouseEnter = function (id) {
        var _a;
        var tiles = this.getTilesOfSameColorInSameFactory(id);
        if ((tiles === null || tiles === void 0 ? void 0 : tiles.length) && this.tilesInFactories[0].some(function (tilesOfColor) { return tilesOfColor.some(function (tile) { return tile.id == id; }); })) {
            (_a = document.getElementById("tileCount".concat(tiles[0].type))) === null || _a === void 0 ? void 0 : _a.classList.add('hover');
        }
        tiles === null || tiles === void 0 ? void 0 : tiles.forEach(function (tile) {
            document.getElementById("tile".concat(tile.id)).classList.add('hover');
        });
    };
    Factories.prototype.tileMouseLeave = function (id) {
        var _a;
        var tiles = this.getTilesOfSameColorInSameFactory(id);
        if (tiles === null || tiles === void 0 ? void 0 : tiles.length) {
            (_a = document.getElementById("tileCount".concat(tiles[0].type))) === null || _a === void 0 ? void 0 : _a.classList.remove('hover');
        }
        tiles === null || tiles === void 0 ? void 0 : tiles.forEach(function (tile) {
            document.getElementById("tile".concat(tile.id)).classList.remove('hover');
        });
    };
    Factories.prototype.undoTakeTiles = function (tiles, from, factoryTilesBefore) {
        var _this = this;
        var _a;
        var promise;
        if (from > 0) {
            var countBefore_1 = (_a = factoryTilesBefore === null || factoryTilesBefore === void 0 ? void 0 : factoryTilesBefore.length) !== null && _a !== void 0 ? _a : 0;
            var count_1 = countBefore_1 + tiles.length;
            if (factoryTilesBefore === null || factoryTilesBefore === void 0 ? void 0 : factoryTilesBefore.length) {
                factoryTilesBefore.forEach(function (tile, index) {
                    var coordinates = _this.getCoordinatesInFactory(index, count_1);
                    var left = coordinates.left;
                    var top = coordinates.top;
                    var tileDiv = document.getElementById("tile".concat(tile.id));
                    tileDiv.style.left = "".concat(left, "px");
                    tileDiv.style.top = "".concat(top, "px");
                });
            }
            promise = Promise.all(tiles.map(function (tile, index) {
                var coordinates = _this.getCoordinatesInFactory(countBefore_1 + index, count_1);
                _this.tilesInFactories[from][tile.type].push(tile);
                var centerIndex = _this.tilesInFactories[0][tile.type].findIndex(function (t) { return tile.id == t.id; });
                if (centerIndex !== -1) {
                    _this.tilesInFactories[0][tile.type].splice(centerIndex, 1);
                }
                var centerCoordIndex = _this.tilesPositionsInCenter[tile.type].findIndex(function (t) { return tile.id == t.id; });
                if (centerCoordIndex !== -1) {
                    _this.tilesPositionsInCenter[tile.type].splice(centerCoordIndex, 1);
                }
                return _this.game.placeTile(tile, "factory".concat(from), coordinates.left, coordinates.top, Math.round(Math.random() * 90 - 45));
            }));
        }
        else {
            var promises = this.discardTiles(tiles.filter(function (tile) { return tile.type > 0; }));
            var tile0 = tiles.find(function (tile) { return tile.type == 0; });
            if (tile0) {
                var coordinates = this.getCoordinatesForTile0();
                promises.push(this.game.placeTile(tile0, "factory0", coordinates.left, coordinates.top));
            }
            promise = Promise.all(promises);
        }
        setTimeout(function () { return _this.updateDiscardedTilesNumbers(); }, ANIMATION_MS);
        return promise;
    };
    Factories.prototype.setRemainingTiles = function (remainingTiles) {
        this.bagCounter.setValue(remainingTiles);
    };
    return Factories;
}());
var HAND_CENTER = 327;
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var nameClass = player.name.indexOf(' ') !== -1 ? 'with-space' : 'without-space';
        var html = "<div id=\"player-table-wrapper-".concat(this.playerId, "\" class=\"player-table-wrapper\">\n        <div id=\"player-hand-").concat(this.playerId, "\" class=\"player-hand ").concat(player.hand.length ? '' : 'empty', "\">\n        </div>\n        <div id=\"player-table-").concat(this.playerId, "\" class=\"player-table ").concat(this.game.isVariant() ? 'variant' : '', "\" style=\"--player-color: #").concat(player.color, ";\">\n            <div class=\"player-name-wrapper shift\">\n                <div id=\"player-name-shift-").concat(this.playerId, "\" class=\"player-name color ").concat(game.isDefaultFont() ? 'standard' : 'azul', " ").concat(nameClass, "\">").concat(player.name, "</div>\n            </div>\n            <div class=\"player-name-wrapper\">\n                <div id=\"player-name-").concat(this.playerId, "\" class=\"player-name dark ").concat(game.isDefaultFont() ? 'standard' : 'azul', " ").concat(nameClass, "\">").concat(player.name, "</div>\n            </div>\n            <div id=\"player-table-").concat(this.playerId, "-line-1\" class=\"special-factory-zero factory\" data-special-factory=\"6\"></div>\n            ");
        for (var i = 1; i <= 5; i++) {
            html += "<div id=\"player-table-".concat(this.playerId, "-line").concat(i, "\" class=\"line\" style=\"top: ").concat(10 + 70 * (i - 1), "px; width: ").concat(69 * i - 5, "px;\"></div>");
        }
        html += "<div id=\"player-table-".concat(this.playerId, "-line0\" class=\"floor line\"></div>");
        html += "<div id=\"player-table-".concat(this.playerId, "-wall\" class=\"wall\">");
        // color-blind marks on wall
        for (var line = 1; line <= 5; line++) {
            var column = ((line + 1) % 5) + 1;
            html += "<div class=\"wall-tile-cb\" style=\"left: ".concat(69 * (column - 1) + 4, "px; top: ").concat(70 * (line - 1) + 4, "px;\"></div>");
        }
        for (var line = 1; line <= 5; line++) {
            for (var column = 1; column <= 5; column++) {
                html += "<div id=\"player-table-".concat(this.playerId, "-wall-spot-").concat(line, "-").concat(column, "\" class=\"wall-spot\" style=\"left: ").concat(69 * (column - 1) - 1, "px; top: ").concat(70 * (line - 1) - 1, "px;\"></div>");
            }
        }
        html += "</div>";
        if (this.game.isVariant()) {
            html += "<div id=\"player-table-".concat(this.playerId, "-column0\" class=\"floor wall-spot\"></div>");
        }
        html += "\n            <div class=\"score-magnified row\">2</div>\n            <div class=\"score-magnified column\">7</div>\n            <div class=\"score-magnified color\">10</div>\n        ";
        html += "   \n            </div>\n        </div>";
        dojo.place(html, 'centered-table');
        this.placeTilesOnHand(player.hand);
        var _loop_3 = function (i) {
            document.getElementById("player-table-".concat(this_3.playerId, "-line").concat(i)).addEventListener('click', function () { return _this.game.selectLine(i); });
        };
        var this_3 = this;
        for (var i = 0; i <= 5; i++) {
            _loop_3(i);
        }
        document.getElementById("player-table-".concat(this.playerId, "-line-1")).addEventListener('click', function () { return _this.game.selectLine(0); });
        if (this.game.isVariant()) {
            var _loop_4 = function (line) {
                var _loop_6 = function (column) {
                    document.getElementById("player-table-".concat(this_4.playerId, "-wall-spot-").concat(line, "-").concat(column)).addEventListener('click', function () {
                        _this.game.selectColumn(line, column);
                    });
                };
                for (var column = 1; column <= 5; column++) {
                    _loop_6(column);
                }
            };
            var this_4 = this;
            for (var line = 1; line <= 5; line++) {
                _loop_4(line);
            }
            document.getElementById("player-table-".concat(this.playerId, "-column0")).addEventListener('click', function () { return _this.game.selectColumn(0, 0); });
        }
        var _loop_5 = function (i) {
            var tiles = player.lines.filter(function (tile) { return tile.line === i; });
            this_5.placeTilesOnLine(tiles, i);
        };
        var this_5 = this;
        for (var i = -1; i <= 5; i++) {
            _loop_5(i);
        }
        this.placeTilesOnWall(player.wall);
        if (this.game.isVariant()) {
            // if player hit refresh when column is selected but not yet applied, we reset ghost tile
            if (this.playerId === this.game.getPlayerId()) {
                player.selectedColumns.forEach(function (selectedColumn) { return _this.setGhostTile(selectedColumn.line, selectedColumn.column, selectedColumn.color); });
            }
        }
    }
    PlayerTable.prototype.placeTilesOnHand = function (tiles) {
        var _this = this;
        var startX = HAND_CENTER - tiles.length * (HALF_TILE_SIZE + 5);
        tiles.forEach(function (tile, index) { return _this.game.placeTile(tile, "player-hand-".concat(_this.playerId), startX + (tiles.length - index) * (HALF_TILE_SIZE + 5) * 2, 5); });
        this.setHandVisible(tiles.length > 0);
    };
    PlayerTable.prototype.placeTilesOnLine = function (tiles, line) {
        var _this = this;
        return Promise.all(tiles.map(function (tile) {
            var left = line == -1 ? 9 : (line > 0 ? (line - tile.column) * 69 : 5 + (tile.column - 1) * 74);
            var top = line == -1 ? 9 : 0;
            return _this.game.placeTile(tile, "player-table-".concat(_this.playerId, "-line").concat(line), left, top);
        }));
    };
    PlayerTable.prototype.placeTilesOnWall = function (tiles) {
        var _this = this;
        tiles.forEach(function (tile) { return _this.game.placeTile(tile, "player-table-".concat(_this.playerId, "-wall-spot-").concat(tile.line, "-").concat(tile.column)); });
    };
    PlayerTable.prototype.setHandVisible = function (visible) {
        dojo.toggleClass("player-hand-".concat(this.playerId), 'empty', !visible);
    };
    PlayerTable.prototype.setGhostTile = function (line, column, color) {
        var spotId = "player-table-".concat(this.playerId, "-wall-spot-").concat(line, "-").concat(column);
        var ghostTileId = "".concat(spotId, "-ghost-tile");
        var existingGhostTile = document.getElementById(ghostTileId);
        existingGhostTile === null || existingGhostTile === void 0 ? void 0 : existingGhostTile.parentElement.removeChild(existingGhostTile);
        if (column > 0) {
            dojo.place("<div id=\"".concat(ghostTileId, "\" class=\"tile tile").concat(color, " ghost\"></div>"), spotId);
        }
    };
    PlayerTable.prototype.setFont = function (prefValue) {
        var defaultFont = prefValue === 1;
        dojo.toggleClass("player-name-shift-".concat(this.playerId), 'standard', defaultFont);
        dojo.toggleClass("player-name-shift-".concat(this.playerId), 'azul', !defaultFont);
        dojo.toggleClass("player-name-".concat(this.playerId), 'standard', defaultFont);
        dojo.toggleClass("player-name-".concat(this.playerId), 'azul', !defaultFont);
    };
    PlayerTable.prototype.setOwnSpecialFactoryZero = function (own) {
        document.getElementById("player-table-".concat(this.playerId)).dataset.specialFactoryZeroOwned = own.toString();
    };
    return PlayerTable;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ANIMATION_MS = 500;
var SCORE_MS = 1500;
var SLOW_SCORE_MS = 2000;
var REFILL_DELAY = [];
REFILL_DELAY[5] = 1600;
REFILL_DELAY[7] = 2200;
REFILL_DELAY[9] = 2900;
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var LOCAL_STORAGE_ZOOM_KEY = 'Azul-zoom';
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var Azul = /** @class */ (function () {
    function Azul() {
        this.playersTables = [];
        this.zoom = 0.75;
        var zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            this.zoom = Number(zoomStr);
        }
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    Azul.prototype.setup = function (gamedatas) {
        var _this = this;
        // ignore loading of some pictures
        if (this.isVariant()) {
            this.dontPreloadImage('playerboard.jpg');
        }
        else {
            this.dontPreloadImage('playerboard-variant.jpg');
        }
        this.dontPreloadImage('publisher.png');
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.createPlayerPanels(gamedatas);
        this.factories = new Factories(this, gamedatas.factoryNumber, gamedatas.factories, gamedatas.remainingTiles, gamedatas.specialFactories);
        this.createPlayerTables(gamedatas);
        // before set
        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            smooth: false,
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            zoomLevels: ZOOM_LEVELS,
            autoZoom: {
                expectedWidth: this.factories.getWidth(),
            },
            onDimensionsChange: function (newZoom) { return _this.onTableCenterSizeChange(newZoom); },
        });
        this.setupNotifications();
        this.setupPreferences();
        if (gamedatas.specialFactories) {
            document.getElementsByTagName('html')[0].dataset.chocolatierSkin = 'true';
            try {
                document.getElementById('preference_control_203').closest(".preference_choice").style.display = 'none';
                document.getElementById('preference_fontrol_203').closest(".preference_choice").style.display = 'none';
                document.getElementById('preference_control_210').closest(".preference_choice").style.display = 'none';
                document.getElementById('preference_fontrol_210').closest(".preference_choice").style.display = 'none';
            }
            catch (e) { }
            document.getElementById('factories').insertAdjacentHTML('beforeend', "<button type=\"button\" id=\"special-factories-help\">".concat(_('Special Factories'), "</button>"));
            document.getElementById('special-factories-help').addEventListener('click', function () { return _this.showHelp(); });
            if (gamedatas.specialFactoryZeroOwner) {
                this.getPlayerTable(gamedatas.specialFactoryZeroOwner).setOwnSpecialFactoryZero(true);
                document.getElementById('factories').dataset.specialFactoryZeroOwned = 'true';
            }
        }
        if (gamedatas.endRound) {
            this.notif_lastRound();
        }
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Azul.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'chooseTile':
                this.onEnteringChooseTile();
                break;
            case 'chooseLine':
                this.onEnteringChooseLine(args.args);
                break;
            case 'privateChooseColumns':
                this.onEnteringChooseColumnsForPlayer(this.getPlayerId(), args.args, true);
                break;
            case 'gameEnd':
                var lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    };
    Azul.prototype.onEnteringChooseTile = function () {
        if (this.isCurrentPlayerActive()) {
            dojo.addClass('factories', 'selectable');
        }
    };
    Azul.prototype.onEnteringChooseLine = function (args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            args.lines.forEach(function (i) { return dojo.addClass("player-table-".concat(_this.getPlayerId(), "-line").concat(i), 'selectable'); });
            dojo.addClass("player-table-".concat(this.getPlayerId(), "-line-1"), 'selectable');
        }
    };
    Azul.prototype.onEnteringChooseColumnsForPlayer = function (playerId, infos, privateMulti) {
        var _this = this;
        var table = this.getPlayerTable(playerId);
        infos.selectedColumns.forEach(function (selectedColumn) { return table.setGhostTile(selectedColumn.line, selectedColumn.column, selectedColumn.color); });
        if (this.isCurrentPlayerActive()) {
            var nextColumnToSelect_1 = infos.nextColumnToSelect;
            if (nextColumnToSelect_1) {
                nextColumnToSelect_1.availableColumns.forEach(function (column) {
                    return dojo.addClass(
                    /*column == 0 ? `player-table-${playerId}-column0` :*/ "player-table-".concat(playerId, "-wall-spot-").concat(nextColumnToSelect_1.line, "-").concat(column), 'selectable');
                });
            }
            if (!privateMulti) {
                if (!document.getElementById('confirmColumns_button')) {
                    this.addActionButton('confirmColumns_button', _("Confirm"), function () { return _this.confirmColumns(); });
                    this.addActionButton('undoColumns_button', _("Undo column selection"), function () { return _this.undoColumns(); }, null, null, 'gray');
                }
                dojo.toggleClass('confirmColumns_button', 'disabled', !!nextColumnToSelect_1);
            }
        }
    };
    Azul.prototype.onEnteringChooseColumns = function (args) {
        var playerId = this.getPlayerId();
        var infos = args.players[playerId];
        if (infos) {
            this.onEnteringChooseColumnsForPlayer(playerId, infos, false);
        }
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Azul.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'chooseTile':
                this.onLeavingChooseTile();
                break;
            case 'chooseLine':
                this.onLeavingChooseLine();
                break;
            case 'chooseColumns':
                this.onLeavingChooseColumns();
                break;
        }
    };
    Azul.prototype.onLeavingChooseTile = function () {
        dojo.removeClass('factories', 'selectable');
    };
    Azul.prototype.onLeavingChooseLine = function () {
        if (!this.gamedatas.players[this.getPlayerId()]) {
            return;
        }
        for (var i = 0; i <= 5; i++) {
            dojo.removeClass("player-table-".concat(this.getPlayerId(), "-line").concat(i), 'selectable');
        }
        dojo.removeClass("player-table-".concat(this.getPlayerId(), "-line-1"), 'selectable');
    };
    Azul.prototype.onLeavingChooseColumns = function () {
        Array.from(document.getElementsByClassName('ghost')).forEach(function (elem) { return elem.parentElement.removeChild(elem); });
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Azul.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        log('onUpdateActionButtons', stateName, args);
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseLine':
                    if (this.gamedatas.undo) {
                        this.addActionButton('undoTakeTiles_button', _("Undo tile selection"), function () { return _this.undoTakeTiles(); });
                    }
                    break;
                case 'confirmLine':
                    this.addActionButton('confirmLine_button', _("Confirm"), function () { return _this.confirmLine(); });
                    this.addActionButton('undoSelectLine_button', _("Undo line selection"), function () { return _this.undoSelectLine(); }, null, null, 'gray');
                    this.startActionTimer('confirmLine_button', 5);
                    break;
                case 'privateChooseColumns':
                case 'privateConfirmColumns':
                    var privateChooseColumnArgs = args;
                    this.addActionButton('confirmColumns_button', _("Confirm"), function () { return _this.confirmColumns(); });
                    this.addActionButton('undoColumns_button', _("Undo column selection"), function () { return _this.undoColumns(); }, null, null, 'gray');
                    dojo.toggleClass('confirmColumns_button', 'disabled', !!privateChooseColumnArgs.nextColumnToSelect && stateName != 'privateConfirmColumns');
                    break;
            }
        }
        switch (stateName) {
            case 'chooseColumns': // for multiplayer states we have to do it here
                this.onEnteringChooseColumns(args);
                break;
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    Azul.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_control_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
            _this.onPreferenceChange(prefId, prefValue);
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
        try {
            document.getElementById('preference_control_299').closest(".preference_choice").style.display = 'none';
            document.getElementById('preference_fontrol_299').closest(".preference_choice").style.display = 'none';
        }
        catch (e) { }
    };
    Azul.prototype.onPreferenceChange = function (prefId, prefValue) {
        switch (prefId) {
            // KEEP
            case 201:
                dojo.toggleClass('table', 'disabled-shimmer', prefValue == 2);
                break;
            case 202:
                dojo.toggleClass(document.getElementsByTagName('html')[0], 'background2', prefValue == 2);
                this.zoomManager.setZoomControlsColor(prefValue == 2 ? 'white' : 'black');
                break;
            case 203:
                dojo.toggleClass(document.getElementsByTagName('html')[0], 'cb', prefValue == 1);
                break;
            case 205:
                dojo.toggleClass(document.getElementsByTagName('html')[0], 'hide-tile-count', prefValue == 2);
                break;
            case 206:
                this.playersTables.forEach(function (playerTable) { return playerTable.setFont(prefValue); });
                break;
            case 210:
                var chocolatierSkin = prefValue == 1 || !!this.gamedatas.specialFactories;
                document.getElementsByTagName('html')[0].dataset.chocolatierSkin = chocolatierSkin.toString();
                try {
                    document.getElementById('preference_control_203').closest(".preference_choice").style.display = chocolatierSkin ? 'none' : null;
                    document.getElementById('preference_fontrol_203').closest(".preference_choice").style.display = chocolatierSkin ? 'none' : null;
                }
                catch (e) { }
                break;
            case 299:
                this.toggleZoomNotice(prefValue == 1);
                break;
        }
    };
    Azul.prototype.toggleZoomNotice = function (visible) {
        var elem = document.getElementById('zoom-notice');
        if (visible) {
            if (!elem) {
                dojo.place("\n                <div id=\"zoom-notice\">\n                    ".concat(_("Use zoom controls to adapt players board size !"), "\n                    <div style=\"text-align: center; margin-top: 10px;\"><a id=\"hide-zoom-notice\">").concat(_("Dismiss"), "</a></div>\n                    <div class=\"arrow-right\"></div>\n                </div>\n                "), 'bga-zoom-controls');
                document.getElementById('hide-zoom-notice').addEventListener('click', function () {
                    var select = document.getElementById('preference_control_299');
                    select.value = '2';
                    var event = new Event('change');
                    select.dispatchEvent(event);
                });
            }
        }
        else if (elem) {
            elem.parentElement.removeChild(elem);
        }
    };
    Azul.prototype.isDefaultFont = function () {
        return Number(this.prefs[206].value) == 1;
    };
    Azul.prototype.startActionTimer = function (buttonId, time) {
        var _a;
        if (((_a = this.prefs[204]) === null || _a === void 0 ? void 0 : _a.value) === 2) {
            return;
        }
        var button = document.getElementById(buttonId);
        var actionTimerId = null;
        var _actionTimerLabel = button.innerHTML;
        var _actionTimerSeconds = time;
        var actionTimerFunction = function () {
            var button = document.getElementById(buttonId);
            if (button == null) {
                window.clearInterval(actionTimerId);
            }
            else if (_actionTimerSeconds-- > 1) {
                button.innerHTML = _actionTimerLabel + ' (' + _actionTimerSeconds + ')';
            }
            else {
                window.clearInterval(actionTimerId);
                button.click();
            }
        };
        actionTimerFunction();
        actionTimerId = window.setInterval(function () { return actionTimerFunction(); }, 1000);
    };
    Azul.prototype.getZoom = function () {
        return this.zoom;
    };
    Azul.prototype.onTableCenterSizeChange = function (newZoom) {
        this.zoom = newZoom;
        var maxWidth = document.getElementById('table').clientWidth;
        var factoriesWidth = document.getElementById('factories').clientWidth;
        var playerTableWidth = 780;
        var tablesMaxWidth = maxWidth - factoriesWidth;
        document.getElementById('centered-table').style.width = tablesMaxWidth < playerTableWidth * this.gamedatas.playerorder.length ?
            "".concat(factoriesWidth + (Math.floor(tablesMaxWidth / playerTableWidth) * playerTableWidth), "px") : "unset";
    };
    Azul.prototype.isVariant = function () {
        return this.gamedatas.variant;
    };
    Azul.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Azul.prototype.getPlayerColor = function (playerId) {
        return this.gamedatas.players[playerId].color;
    };
    Azul.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Azul.prototype.incScore = function (playerId, incScore) {
        var _a, _b, _c;
        if (((_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.getValue()) + incScore < 0) {
            (_b = this.scoreCtrl[playerId]) === null || _b === void 0 ? void 0 : _b.toValue(0);
        }
        else {
            (_c = this.scoreCtrl[playerId]) === null || _c === void 0 ? void 0 : _c.incValue(incScore);
        }
    };
    Azul.prototype.placeTile = function (tile, destinationId, left, top, rotation) {
        var _this = this;
        //this.removeTile(tile);
        //dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="left: ${left}px; top: ${top}px;"></div>`, destinationId);
        var tileDiv = document.getElementById("tile".concat(tile.id));
        if (tileDiv) {
            return slideToObjectAndAttach(this, tileDiv, destinationId, left, top, rotation);
        }
        else {
            dojo.place("<div id=\"tile".concat(tile.id, "\" class=\"tile tile").concat(tile.type, "\" style=\"").concat(left !== undefined ? "left: ".concat(left, "px;") : '').concat(top !== undefined ? "top: ".concat(top, "px;") : '').concat(rotation ? "transform: rotate(".concat(rotation, "deg)") : '', "\" data-rotation=\"").concat(rotation !== null && rotation !== void 0 ? rotation : 0, "\"></div>"), destinationId);
            var newTileDiv = document.getElementById("tile".concat(tile.id));
            newTileDiv.addEventListener('click', function () {
                _this.takeTiles(tile.id);
                _this.factories.tileMouseLeave(tile.id);
            });
            newTileDiv.addEventListener('mouseenter', function () { return _this.factories.tileMouseEnter(tile.id); });
            newTileDiv.addEventListener('mouseleave', function () { return _this.factories.tileMouseLeave(tile.id); });
            return Promise.resolve(true);
        }
    };
    Azul.prototype.removeColumnSelection = function () {
        if (!this.gamedatas.players[this.getPlayerId()]) {
            return;
        }
        for (var line = 1; line <= 5; line++) {
            for (var column = 1; column <= 5; column++) {
                dojo.removeClass("player-table-".concat(this.getPlayerId(), "-wall-spot-").concat(line, "-").concat(column), 'selectable');
            }
        }
        dojo.removeClass("player-table-".concat(this.getPlayerId(), "-column0"), 'selectable');
    };
    Azul.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // first player token
            dojo.place("<div id=\"player_board_".concat(player.id, "_firstPlayerWrapper\" class=\"firstPlayerWrapper disabled-shimmer\"></div>"), "player_board_".concat(player.id));
            if (gamedatas.firstPlayerTokenPlayerId === playerId) {
                _this.placeFirstPlayerToken(gamedatas.firstPlayerTokenPlayerId);
            }
        });
    };
    Azul.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        orderedPlayers.forEach(function (player) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    Azul.prototype.createPlayerTable = function (gamedatas, playerId) {
        this.playersTables.push(new PlayerTable(this, gamedatas.players[playerId]));
    };
    Azul.prototype.removeTile = function (tile, fadeOut) {
        // we don't remove the FP tile, it just goes back to the center
        if (tile.type == 0) {
            var coordinates = this.factories.getCoordinatesForTile0();
            this.placeTile(tile, "factory0", coordinates.left, coordinates.top, undefined);
        }
        else {
            var divElement = document.getElementById("tile".concat(tile.id));
            if (divElement) {
                if (fadeOut) {
                    var destroyedId = "".concat(divElement.id, "-to-be-destroyed");
                    divElement.id = destroyedId;
                    this.fadeOutAndDestroy(destroyedId);
                }
                else {
                    divElement.parentElement.removeChild(divElement);
                }
            }
        }
    };
    Azul.prototype.removeTiles = function (tiles, fadeOut) {
        var _this = this;
        tiles.forEach(function (tile) { return _this.removeTile(tile, fadeOut); });
    };
    Azul.prototype.showHelp = function () {
        var helpDialog = new ebg.popindialog();
        helpDialog.create('azulChocolatierVariantHelpDialog');
        helpDialog.setTitle(_("Special Factories"));
        var html = "\n        <div id=\"help-popin\">\n            <div class=\"row\">\n                <div class=\"picture\">\n                    <div class=\"factory\" data-special-factory=\"9\"></div>\n                </div>\n                <span class=\"title\">SF 1.</span> ".concat(_("After setting up the round, add 1 tile from the bag on this Special Factory display."), "\n            </div>\n            <div class=\"row\">\n                <div class=\"picture\">\n                    <div class=\"factory\" data-special-factory=\"1\"></div>\n                    <div class=\"factory\" data-special-factory=\"2\"></div>\n                    <div class=\"factory\" data-special-factory=\"3\"></div>\n                    <div class=\"factory\" data-special-factory=\"4\"></div>\n                    <div class=\"factory\" data-special-factory=\"5\"></div>\n                </div>\n                <span class=\"title\">SF 2.</span> ").concat(_("After setting up the round, take 1 tile of the illustrated pattern from both adjacent Factory displays to the immediate left and right (if possible), and place them on this Special factory display."), "\n            </div>\n            <div class=\"row\">\n                <div class=\"picture\">\n                    <div class=\"factory\" data-special-factory=\"8\"></div>\n                </div>\n                <span class=\"title\">SF 3.</span> ").concat(_("When a player picks tiles from this Special Factory display, the remaining tiles are not moved to the center of the table but remain on it."), "\n            </div>\n            <div class=\"row disabled\">\n                <div class=\"picture\">\n                    <div class=\"factory\" data-special-factory=\"7\"></div>\n                </div>\n                <span class=\"title\">SF 4.</span> ").concat(_("When a player picks tiles from this Special Factory display, the remaining tiles are not moved to the center of the table. Instead, that player moves them to the Factory display (blue or gold) to its immediate left and/or right, dividing the tiles between those 2 displays. The only restriction is that tiles of one color may not be split up."), "\n            </div>\n            <div class=\"row\">\n                <div class=\"picture\">\n                    <div class=\"factory\" data-special-factory=\"6\"></div>\n                </div>\n                <span class=\"title\">SF 5.</span> ").concat(_("When a player picks tiles from this Special Factory display, the remaining tiles are moved to the center of the table. Then, that player places this Special Factory as an extra space next to their Foundry line until the end of the round. The next tile that must be placed in their foundry line is placed on this Special factory instead, skipping the penalty."), "\n            </div>\n        </div>\n        ");
        // Show the dialog
        helpDialog.setContent(html);
        helpDialog.show();
    };
    Azul.prototype.takeTiles = function (id) {
        if (!this.checkAction('takeTiles')) {
            return;
        }
        this.takeAction('takeTiles', {
            id: id
        });
    };
    Azul.prototype.undoTakeTiles = function () {
        if (!this.checkAction('undoTakeTiles')) {
            return;
        }
        this.takeAction('undoTakeTiles');
    };
    Azul.prototype.selectLine = function (line) {
        if (!this.checkAction('selectLine')) {
            return;
        }
        this.takeAction('selectLine', {
            line: line
        });
    };
    Azul.prototype.confirmLine = function () {
        if (!this.checkAction('confirmLine')) {
            return;
        }
        this.takeAction('confirmLine');
    };
    Azul.prototype.undoSelectLine = function () {
        if (!this.checkAction('undoSelectLine')) {
            return;
        }
        this.takeAction('undoSelectLine');
    };
    Azul.prototype.selectColumn = function (line, column) {
        if (!this.checkAction('selectColumn')) {
            return;
        }
        this.takeAction('selectColumn', {
            line: line,
            column: column
        });
        this.removeColumnSelection();
    };
    Azul.prototype.confirmColumns = function () {
        if (!this.checkAction('confirmColumns')) {
            return;
        }
        this.takeAction('confirmColumns');
    };
    Azul.prototype.undoColumns = function () {
        if (!this.checkAction('undoColumns')) {
            return;
        }
        this.takeAction('undoColumns');
    };
    Azul.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/azul/azul/".concat(action, ".html"), data, this, function () { });
    };
    Azul.prototype.placeFirstPlayerToken = function (playerId) {
        var firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            slideToObjectAndAttach(this, firstPlayerToken, "player_board_".concat(playerId, "_firstPlayerWrapper"));
        }
        else {
            dojo.place('<div id="firstPlayerToken" class="tile tile0"></div>', "player_board_".concat(playerId, "_firstPlayerWrapper"));
            this.addTooltipHtml('firstPlayerToken', _("First Player token. Player with this token will start the next turn"));
        }
    };
    Azul.prototype.displayScoringOnTile = function (tile, playerId, points) {
        // create a div over tile, same position and width, but no overflow hidden (that must be kept on tile for glowing effect)
        dojo.place("<div id=\"tile".concat(tile.id, "-scoring\" class=\"scoring-tile\"></div>"), "player-table-".concat(playerId, "-wall-spot-").concat(tile.line, "-").concat(tile.column));
        this.displayScoring("tile".concat(tile.id, "-scoring"), this.getPlayerColor(Number(playerId)), points, SCORE_MS);
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your azul.game.php file.

    */
    Azul.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
            ['factoriesFilled', ANIMATION_MS + REFILL_DELAY[this.gamedatas.factoryNumber]],
            ['factoriesChanged', ANIMATION_MS],
            ['factoriesCompleted', ANIMATION_MS],
            ['tilesSelected', ANIMATION_MS],
            ['undoTakeTiles', ANIMATION_MS],
            ['tilesPlacedOnLine', ANIMATION_MS],
            ['undoSelectLine', ANIMATION_MS],
            ['placeTileOnWall', this.gamedatas.fastScoring ? SCORE_MS : SLOW_SCORE_MS],
            ['emptyFloorLine', this.gamedatas.fastScoring ? SCORE_MS : SLOW_SCORE_MS],
            ['endScore', this.gamedatas.fastScoring ? SCORE_MS : SLOW_SCORE_MS],
            ['firstPlayerToken', 1],
            ['lastRound', 1],
            ['removeLastRound', 1],
            ['updateSelectColumn', 1],
            ['moveSpecialFactoryZero', ANIMATION_MS],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Azul.prototype.notif_factoriesFilled = function (notif) {
        this.factories.fillFactories(notif.args.factories, notif.args.remainingTiles);
    };
    Azul.prototype.notif_factoriesChanged = function (notif) {
        this.factories.factoriesChanged(notif.args);
    };
    Azul.prototype.notif_factoriesCompleted = function (notif) {
        this.factories.factoriesCompleted(notif.args);
    };
    Azul.prototype.notif_tilesSelected = function (notif) {
        if (notif.args.fromFactory == 0) {
            this.factories.centerColorRemoved(notif.args.selectedTiles[0].type);
        }
        else {
            this.factories.factoryTilesRemoved(notif.args.fromFactory);
        }
        var table = this.getPlayerTable(notif.args.playerId);
        table.placeTilesOnHand(notif.args.selectedTiles);
        this.factories.discardTiles(notif.args.discardedTiles);
    };
    Azul.prototype.notif_undoTakeTiles = function (notif) {
        var _this = this;
        this.placeFirstPlayerToken(notif.args.undo.previousFirstPlayer);
        this.factories.undoTakeTiles(notif.args.undo.tiles, notif.args.undo.from, notif.args.factoryTilesBefore).then(function () { return _this.getPlayerTable(notif.args.playerId).setHandVisible(false); });
    };
    Azul.prototype.notif_tilesPlacedOnLine = function (notif) {
        var _this = this;
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.discardedTiles, 0);
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.discardedTilesToSpecialFactoryZero, -1);
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.placedTiles, notif.args.line).then(function () {
            if (notif.args.fromHand) {
                _this.getPlayerTable(notif.args.playerId).setHandVisible(false);
            }
        });
    };
    Azul.prototype.notif_undoSelectLine = function (notif) {
        var table = this.getPlayerTable(notif.args.playerId);
        table.placeTilesOnHand(notif.args.undo.tiles);
        if (document.getElementById('last-round') && !notif.args.undo.lastRoundBefore) {
            dojo.destroy('last-round');
        }
    };
    Azul.prototype.notif_placeTileOnWall = function (notif) {
        var _this = this;
        Object.keys(notif.args.completeLines).forEach(function (playerId) {
            var completeLine = notif.args.completeLines[playerId];
            _this.getPlayerTable(Number(playerId)).placeTilesOnWall([completeLine.placedTile]);
            completeLine.pointsDetail.columnTiles.forEach(function (tile) { return dojo.addClass("tile".concat(tile.id), 'highlight'); });
            setTimeout(function () { return completeLine.pointsDetail.columnTiles.forEach(function (tile) { return dojo.removeClass("tile".concat(tile.id), 'highlight'); }); }, SCORE_MS - 50);
            _this.removeTiles(completeLine.discardedTiles, true);
            _this.displayScoringOnTile(completeLine.placedTile, playerId, completeLine.pointsDetail.points);
            _this.incScore(Number(playerId), completeLine.pointsDetail.points);
        });
    };
    Azul.prototype.notif_emptyFloorLine = function (notif) {
        var _this = this;
        Object.keys(notif.args.floorLines).forEach(function (playerId) {
            var floorLine = notif.args.floorLines[playerId];
            _this.removeTiles(notif.args.specialFactoryZeroTiles[playerId], true);
            setTimeout(function () { return _this.removeTiles(floorLine.tiles, true); }, SCORE_MS - 50);
            _this.displayScoring("player-table-".concat(playerId, "-line0"), _this.getPlayerColor(Number(playerId)), floorLine.points, SCORE_MS);
            _this.incScore(Number(playerId), floorLine.points);
        });
    };
    Azul.prototype.notif_endScore = function (notif) {
        var _this = this;
        Object.keys(notif.args.scores).forEach(function (playerId) {
            var endScore = notif.args.scores[playerId];
            endScore.tiles.forEach(function (tile) { return dojo.addClass("tile".concat(tile.id), 'highlight'); });
            setTimeout(function () { return endScore.tiles.forEach(function (tile) { return dojo.removeClass("tile".concat(tile.id), 'highlight'); }); }, SCORE_MS - 50);
            _this.displayScoringOnTile(endScore.tiles[2], playerId, endScore.points);
            _this.incScore(Number(playerId), endScore.points);
        });
    };
    Azul.prototype.notif_firstPlayerToken = function (notif) {
        this.placeFirstPlayerToken(notif.args.playerId);
    };
    Azul.prototype.notif_updateSelectColumn = function (notif) {
        if (notif.args.undo) {
            this.removeColumnSelection();
            this.onLeavingChooseColumns();
        }
        if (this.gamedatas.gamestate.name === 'chooseColumns') {
            // when a player is deactivated, updateActionButton calling onEnteringChooseColumns is called with old args.
            // so we set args up-to-date to avoid conflict between current situation and old args
            this.gamedatas.gamestate.args.players[notif.args.playerId] = notif.args.arg;
        }
        this.onEnteringChooseColumnsForPlayer(notif.args.playerId, notif.args.arg, this.gamedatas.gamestate.name !== 'chooseColumns');
    };
    Azul.prototype.notif_lastRound = function () {
        if (document.getElementById('last-round')) {
            return;
        }
        var message = _("This is the last round of the game!");
        if (this.isVariant()) {
            message += ' <i>(' + _("if the complete line can be placed on the wall") + ')</i>';
        }
        dojo.place("<div id=\"last-round\">".concat(message, "</div>"), 'page-title');
    };
    Azul.prototype.notif_removeLastRound = function () {
        if (document.getElementById('last-round')) {
            dojo.destroy('last-round');
        }
    };
    Azul.prototype.notif_moveSpecialFactoryZero = function (notif) {
        document.getElementById('factories').dataset.specialFactoryZeroOwned = (!!notif.args.playerId).toString();
        this.playersTables.forEach(function (playerTable) { return playerTable.setOwnSpecialFactoryZero(notif.args.playerId == playerTable.playerId); });
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Azul.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (typeof args.lineNumber === 'number') {
                    args.lineNumber = "<strong>".concat(args.line, "</strong>");
                }
                if (log.indexOf('${number} ${color}') !== -1 && typeof args.type === 'number') {
                    var number = args.number;
                    var html = '';
                    for (var i = 0; i < number; i++) {
                        html += "<div class=\"tile tile".concat(args.type, "\"></div>");
                    }
                    log = _(log).replace('${number} ${color}', html);
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return Azul;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.azul", ebg.core.gamegui, new Azul());
});
