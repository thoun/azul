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
        object.style.transition = "transform 0.5s ease-in";
        object.style.transform = "translate(" + deltaX / game.getZoom() + "px, " + deltaY / game.getZoom() + "px) rotate(" + rotation + "deg)";
        var transitionend = function () {
            //console.log('ontransitionend', object, destination);
            object.style.top = posY !== undefined ? posY + "px" : 'unset';
            object.style.left = posX !== undefined ? posX + "px" : 'unset';
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            object.style.zIndex = originalZIndex ? '' + originalZIndex : 'unset';
            object.style.transform = rotation ? "rotate(" + rotation + "deg)" : 'unset';
            object.style.transition = 'unset';
            destination.appendChild(object);
            object.removeEventListener('transitionend', transitionend);
            resolve(true);
        };
        object.addEventListener('transitionend', transitionend);
    });
}
var FACTORY_RADIUS = 125;
var HALF_TILE_SIZE = 29;
var CENTER_FACTORY_TILE_SHIFT = 12;
var Factories = /** @class */ (function () {
    function Factories(game, factoryNumber, factories, remainingTiles) {
        this.game = game;
        this.factoryNumber = factoryNumber;
        this.tilesPositionsInCenter = [[], [], [], [], [], []]; // color, tiles
        this.tilesInFactories = []; // factory, color, tiles
        var factoriesDiv = document.getElementById('factories');
        var radius = 175 + factoryNumber * 25;
        var halfSize = radius + FACTORY_RADIUS;
        var size = halfSize * 2 + "px";
        factoriesDiv.style.width = size;
        factoriesDiv.style.height = size;
        var html = "<div>";
        html += "<div id=\"factory0\" class=\"factory-center\"></div>";
        for (var i = 1; i <= factoryNumber; i++) {
            var angle = (i - 1) * Math.PI * 2 / factoryNumber; // in radians
            var left = radius * Math.sin(angle);
            var top_1 = radius * Math.cos(angle);
            html += "<div id=\"factory" + i + "\" class=\"factory\" style=\"left: " + (halfSize - FACTORY_RADIUS + left) + "px; top: " + (halfSize - FACTORY_RADIUS - top_1) + "px;\"></div>";
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
    Factories.prototype.getCoordinatesInFactory = function (tileIndex) {
        return {
            left: 50 + Math.floor(tileIndex / 2) * 90,
            top: 50 + Math.floor(tileIndex % 2) * 90,
        };
    };
    Factories.prototype.getCoordinatesForTile0 = function () {
        var centerFactoryDiv = document.getElementById('factory0');
        return {
            left: centerFactoryDiv.clientWidth / 2 - HALF_TILE_SIZE,
            top: centerFactoryDiv.clientHeight / 2 - HALF_TILE_SIZE,
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
                    var coordinates = _this.getCoordinatesInFactory(index);
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
                    _this.game.placeTile(tile, "factory" + factoryIndex, left, top, tile.type !== 0 ? Math.round(Math.random() * 90 - 45) : undefined);
                }
                else {
                    var delay = animation ? tileIndex * 80 : 0;
                    setTimeout(function () {
                        _this.game.placeTile(tile, "bag-empty", 20, 20, 0);
                        slideToObjectAndAttach(_this.game, document.getElementById("tile" + tile.id), "factory" + factoryIndex, left, top, Math.round(Math.random() * 90 - 45));
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
    Factories.prototype.discardTiles = function (discardedTiles) {
        var _this = this;
        var promise = discardedTiles.map(function (tile) {
            var _a = _this.getFreePlaceForFactoryCenter(tile.type), left = _a.left, top = _a.top;
            _this.tilesInFactories[0][tile.type].push(tile);
            _this.tilesPositionsInCenter[tile.type].push({ id: tile.id, x: left, y: top });
            var rotation = Number(document.getElementById("tile" + tile.id).dataset.rotation || 0);
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
        newPlace.y = yCenter - HALF_TILE_SIZE - distance * Math.cos(angle);
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
        var place = { x: 0, y: 0 };
        this.setRandomCoordinates(place, xCenter, yCenter, radius, color);
        var minDistance = this.getMinDistance(placedTiles, place);
        var protection = 0;
        while (protection < 1000 && minDistance < HALF_TILE_SIZE * 2) {
            var newPlace = { x: 0, y: 0 };
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
                y: yCenter - HALF_TILE_SIZE,
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
            var numberDiv = document.getElementById("tileCount" + type);
            if (!number) {
                numberDiv === null || numberDiv === void 0 ? void 0 : numberDiv.parentElement.removeChild(numberDiv);
                return "continue";
            }
            var x = this_2.tilesPositionsInCenter[type].reduce(function (sum, place) { return sum + place.x; }, 0) / number + 14;
            var y = this_2.tilesPositionsInCenter[type].reduce(function (sum, place) { return sum + place.y; }, 0) / number + 14;
            if (numberDiv) {
                numberDiv.style.left = x + "px";
                numberDiv.style.top = y + "px";
                numberDiv.innerHTML = '' + number;
            }
            else {
                dojo.place("\n                <div id=\"tileCount" + type + "\" class=\"tile-count tile" + type + "\" style=\"left: " + x + "px; top: " + y + "px;\">" + number + "</div>\n                ", 'factories');
                var newNumberDiv = document.getElementById("tileCount" + type);
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
        if (tiles === null || tiles === void 0 ? void 0 : tiles.length) {
            (_a = document.getElementById("tileCount" + tiles[0].type)) === null || _a === void 0 ? void 0 : _a.classList.add('hover');
        }
        tiles === null || tiles === void 0 ? void 0 : tiles.forEach(function (tile) {
            document.getElementById("tile" + tile.id).classList.add('hover');
        });
    };
    Factories.prototype.tileMouseLeave = function (id) {
        var _a;
        var tiles = this.getTilesOfSameColorInSameFactory(id);
        if (tiles === null || tiles === void 0 ? void 0 : tiles.length) {
            (_a = document.getElementById("tileCount" + tiles[0].type)) === null || _a === void 0 ? void 0 : _a.classList.remove('hover');
        }
        tiles === null || tiles === void 0 ? void 0 : tiles.forEach(function (tile) {
            document.getElementById("tile" + tile.id).classList.remove('hover');
        });
    };
    Factories.prototype.undoTakeTiles = function (tiles, from) {
        var _this = this;
        var promise;
        if (from > 0) {
            promise = Promise.all(tiles.map(function (tile, index) {
                var coordinates = _this.getCoordinatesInFactory(index);
                _this.tilesInFactories[from][tile.type].push(tile);
                var centerIndex = _this.tilesInFactories[0][tile.type].findIndex(function (t) { return tile.id == t.id; });
                if (centerIndex !== -1) {
                    _this.tilesInFactories[0][tile.type].splice(centerIndex, 1);
                }
                var centerCoordIndex = _this.tilesPositionsInCenter[tile.type].findIndex(function (t) { return tile.id == t.id; });
                if (centerCoordIndex !== -1) {
                    _this.tilesPositionsInCenter[tile.type].splice(centerCoordIndex, 1);
                }
                return _this.game.placeTile(tile, "factory" + from, coordinates.left, coordinates.top, Math.round(Math.random() * 90 - 45));
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
        document.getElementById("bag-empty").style.height = 100 - remainingTiles + "%";
    };
    return Factories;
}());
var HAND_CENTER = 327;
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "<div id=\"player-table-wrapper-" + this.playerId + "\" class=\"player-table-wrapper\">\n        <div id=\"player-hand-" + this.playerId + "\" class=\"player-hand " + (player.hand.length ? '' : 'empty') + "\">\n        </div>\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table " + (this.game.isVariant() ? 'variant' : '') + "\" style=\"border-color: #" + player.color + "; box-shadow: 0 0 5px 2px #" + player.color + ";\">\n            <div class=\"player-name-wrapper shift\">\n                <div id=\"player-name-shift-" + this.playerId + "\" class=\"player-name color " + (game.isDefaultFont() ? 'standard' : 'azul') + "\" style=\"color: #" + player.color + ";\">" + player.name + "</div>\n            </div>\n            <div class=\"player-name-wrapper\">\n                <div id=\"player-name-" + this.playerId + "\" class=\"player-name dark " + (game.isDefaultFont() ? 'standard' : 'azul') + "\">" + player.name + "</div>\n            </div>";
        for (var i = 1; i <= 5; i++) {
            html += "<div id=\"player-table-" + this.playerId + "-line" + i + "\" class=\"line\" style=\"top: " + (10 + 70 * (i - 1)) + "px; width: " + (69 * i - 5) + "px;\"></div>";
        }
        html += "<div id=\"player-table-" + this.playerId + "-line0\" class=\"floor line\"></div>";
        html += "<div id=\"player-table-" + this.playerId + "-wall\" class=\"wall\">";
        for (var line = 1; line <= 5; line++) {
            for (var column = 1; column <= 5; column++) {
                html += "<div id=\"player-table-" + this.playerId + "-wall-spot-" + line + "-" + column + "\" class=\"wall-spot\" style=\"left: " + (69 * (column - 1) - 1) + "px; top: " + (70 * (line - 1) - 1) + "px;\"></div>";
            }
        }
        html += "</div>";
        if (this.game.isVariant()) {
            html += "<div id=\"player-table-" + this.playerId + "-column0\" class=\"floor wall-spot\"></div>";
        }
        html += "    </div>\n        </div>";
        dojo.place(html, 'table');
        this.placeTilesOnHand(player.hand);
        var _loop_3 = function (i) {
            document.getElementById("player-table-" + this_3.playerId + "-line" + i).addEventListener('click', function () { return _this.game.selectLine(i); });
        };
        var this_3 = this;
        for (var i = 0; i <= 5; i++) {
            _loop_3(i);
        }
        if (this.game.isVariant()) {
            var _loop_4 = function (line) {
                var _loop_6 = function (column) {
                    document.getElementById("player-table-" + this_4.playerId + "-wall-spot-" + line + "-" + column).addEventListener('click', function () {
                        _this.game.selectColumn(column);
                        _this.setGhostTile(line, column);
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
            document.getElementById("player-table-" + this.playerId + "-column0").addEventListener('click', function () { return _this.game.selectColumn(0); });
        }
        var _loop_5 = function (i) {
            var tiles = player.lines.filter(function (tile) { return tile.line === i; });
            this_5.placeTilesOnLine(tiles, i);
        };
        var this_5 = this;
        for (var i = 0; i <= 5; i++) {
            _loop_5(i);
        }
        this.placeTilesOnWall(player.wall);
        if (this.game.isVariant()) {
            // if player hit refresh when column is selected but not yet applied, we reset ghost tile
            if (player.selectedColumn && this.playerId === this.game.getPlayerId()) {
                var tiles = player.lines.filter(function (tile) { return tile.line === player.selectedLine; });
                this.setGhostTile(player.selectedLine, player.selectedColumn, tiles[0].type);
            }
        }
    }
    PlayerTable.prototype.placeTilesOnHand = function (tiles) {
        var _this = this;
        var startX = HAND_CENTER - tiles.length * (HALF_TILE_SIZE + 5);
        tiles.forEach(function (tile, index) { return _this.game.placeTile(tile, "player-hand-" + _this.playerId, startX + (tiles.length - index) * (HALF_TILE_SIZE + 5) * 2, 5); });
        this.setHandVisible(tiles.length > 0);
    };
    PlayerTable.prototype.placeTilesOnLine = function (tiles, line) {
        var _this = this;
        return Promise.all(tiles.map(function (tile) {
            var left = line ? (line - tile.column) * 69 : 5 + (tile.column - 1) * 74;
            return _this.game.placeTile(tile, "player-table-" + _this.playerId + "-line" + line, left, 0);
        }));
    };
    PlayerTable.prototype.placeTilesOnWall = function (tiles) {
        var _this = this;
        tiles.forEach(function (tile) { return _this.game.placeTile(tile, "player-table-" + _this.playerId + "-wall-spot-" + tile.line + "-" + tile.column); });
    };
    PlayerTable.prototype.setHandVisible = function (visible) {
        dojo.toggleClass("player-hand-" + this.playerId, 'empty', !visible);
    };
    PlayerTable.prototype.setGhostTile = function (line, column, color) {
        if (color === void 0) { color = null; }
        dojo.place("<div class=\"tile tile" + (color !== null && color !== void 0 ? color : this.handColor) + " ghost\"></div>", "player-table-" + this.playerId + "-wall-spot-" + line + "-" + column);
    };
    PlayerTable.prototype.setFont = function (prefValue) {
        var defaultFont = prefValue === 1;
        dojo.toggleClass("player-name-shift-" + this.playerId, 'standard', defaultFont);
        dojo.toggleClass("player-name-shift-" + this.playerId, 'azul', !defaultFont);
        dojo.toggleClass("player-name-" + this.playerId, 'standard', defaultFont);
        dojo.toggleClass("player-name-" + this.playerId, 'azul', !defaultFont);
    };
    return PlayerTable;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var ANIMATION_MS = 500;
var SCORE_MS = 1500;
var SLOW_SCORE_MS = 2000;
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0];
var LOCAL_STORAGE_ZOOM_KEY = 'Azul-zoom';
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var Azul = /** @class */ (function () {
    function Azul() {
        this.playersTables = [];
        this.zoom = 1;
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
        this.factories = new Factories(this, gamedatas.factoryNumber, gamedatas.factories, gamedatas.remainingTiles);
        this.createPlayerTables(gamedatas);
        this.setupNotifications();
        this.setupPreferences();
        if (gamedatas.endRound) {
            this.notif_lastRound();
        }
        document.getElementById('zoom-out').addEventListener('click', function () { return _this.zoomOut(); });
        document.getElementById('zoom-in').addEventListener('click', function () { return _this.zoomIn(); });
        this.onScreenWidthChange = function () { return _this.setAutoZoom(); };
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
            args.lines.forEach(function (i) { return dojo.addClass("player-table-" + _this.getPlayerId() + "-line" + i, 'selectable'); });
        }
    };
    Azul.prototype.onEnteringChooseColumn = function (args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            var playerId_1 = this.getPlayerId();
            args.columns[playerId_1].forEach(function (column) {
                _this.getPlayerTable(playerId_1).handColor = args.colors[playerId_1];
                dojo.addClass(column == 0 ? "player-table-" + _this.getPlayerId() + "-column0" : "player-table-" + _this.getPlayerId() + "-wall-spot-" + args.line + "-" + column, 'selectable');
            });
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
            case 'chooseColumn':
                this.onLeavingChooseColumn();
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
            dojo.removeClass("player-table-" + this.getPlayerId() + "-line" + i, 'selectable');
        }
    };
    Azul.prototype.onLeavingChooseColumn = function () {
        if (!this.gamedatas.players[this.getPlayerId()]) {
            return;
        }
        for (var line = 1; line <= 5; line++) {
            for (var column = 1; column <= 5; column++) {
                dojo.removeClass("player-table-" + this.getPlayerId() + "-wall-spot-" + line + "-" + column, 'selectable');
            }
        }
        dojo.removeClass("player-table-" + this.getPlayerId() + "-column0", 'selectable');
        Array.from(document.getElementsByClassName('ghost')).forEach(function (elem) { return elem.parentElement.removeChild(elem); });
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Azul.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
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
                case 'chooseColumn': // for multiplayer states we have to do it here
                    this.onEnteringChooseColumn(args);
                    break;
            }
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
    };
    Azul.prototype.onPreferenceChange = function (prefId, prefValue) {
        switch (prefId) {
            // KEEP
            case 201:
                dojo.toggleClass('table', 'disabled-shimmer', prefValue == 2);
                break;
            case 202:
                dojo.toggleClass(document.getElementsByTagName('html')[0], 'background2', prefValue == 2);
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
    Azul.prototype.setAutoZoom = function () {
        var zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;
        var factoryWidth = this.factories.getWidth();
        var newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth / newZoom < factoryWidth) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        // zoom will also place player tables. we call setZoom even if this method didn't change it because it might have been changed by localStorage zoom
        this.setZoom(newZoom);
    };
    Azul.prototype.setZoom = function (zoom) {
        if (zoom === void 0) { zoom = 1; }
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, '' + this.zoom);
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);
        var div = document.getElementById('table');
        var hands = Array.from(document.getElementsByClassName('hand'));
        if (zoom === 1) {
            div.style.transform = '';
            div.style.margin = '';
            hands.forEach(function (hand) {
                hand.style.transform = '';
                hand.style.margin = '';
            });
        }
        else {
            div.style.transform = "scale(" + zoom + ")";
            div.style.margin = "0 " + ZOOM_LEVELS_MARGIN[newIndex] + "% " + (1 - zoom) * -100 + "% 0";
            hands.forEach(function (hand) {
                hand.style.transform = "scale(" + zoom + ")";
                hand.style.margin = "0 " + ZOOM_LEVELS_MARGIN[newIndex] + "% 0 0";
            });
        }
        document.getElementById('zoom-wrapper').style.height = div.getBoundingClientRect().height + "px";
    };
    Azul.prototype.zoomIn = function () {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    Azul.prototype.zoomOut = function () {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
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
        var tileDiv = document.getElementById("tile" + tile.id);
        if (tileDiv) {
            return slideToObjectAndAttach(this, tileDiv, destinationId, left, top, rotation);
        }
        else {
            dojo.place("<div id=\"tile" + tile.id + "\" class=\"tile tile" + tile.type + "\" style=\"" + (left !== undefined ? "left: " + left + "px;" : '') + (top !== undefined ? "top: " + top + "px;" : '') + (rotation ? "transform: rotate(" + rotation + "deg)" : '') + "\" data-rotation=\"" + (rotation !== null && rotation !== void 0 ? rotation : 0) + "\"></div>", destinationId);
            var newTileDiv = document.getElementById("tile" + tile.id);
            newTileDiv.addEventListener('click', function () {
                _this.takeTiles(tile.id);
                _this.factories.tileMouseLeave(tile.id);
            });
            newTileDiv.addEventListener('mouseenter', function () { return _this.factories.tileMouseEnter(tile.id); });
            newTileDiv.addEventListener('mouseleave', function () { return _this.factories.tileMouseLeave(tile.id); });
            return Promise.resolve(true);
        }
    };
    Azul.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // first player token
            dojo.place("<div id=\"player_board_" + player.id + "_firstPlayerWrapper\" class=\"firstPlayerWrapper disabled-shimmer\"></div>", "player_board_" + player.id);
            if (gamedatas.firstPlayerTokenPlayerId === playerId) {
                _this.placeFirstPlayerToken(gamedatas.firstPlayerTokenPlayerId);
            }
        });
    };
    Azul.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex)), players.slice(0, playerIndex)) : players;
        orderedPlayers.forEach(function (player) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    Azul.prototype.createPlayerTable = function (gamedatas, playerId) {
        this.playersTables.push(new PlayerTable(this, gamedatas.players[playerId]));
    };
    Azul.prototype.removeTile = function (tile, fadeOut) {
        if (document.getElementById("tile" + tile.id)) {
            fadeOut ?
                this.fadeOutAndDestroy("tile" + tile.id) :
                dojo.destroy("tile" + tile.id);
        }
    };
    Azul.prototype.removeTiles = function (tiles, fadeOut) {
        var _this = this;
        tiles.forEach(function (tile) { return _this.removeTile(tile, fadeOut); });
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
    Azul.prototype.selectColumn = function (column) {
        if (!this.checkAction('selectColumn')) {
            return;
        }
        this.takeAction('selectColumn', {
            column: column
        });
        this.onLeavingChooseColumn();
    };
    Azul.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/azul/azul/" + action + ".html", data, this, function () { });
    };
    Azul.prototype.placeFirstPlayerToken = function (playerId) {
        var firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            slideToObjectAndAttach(this, firstPlayerToken, "player_board_" + playerId + "_firstPlayerWrapper");
        }
        else {
            dojo.place('<div id="firstPlayerToken" class="tile tile0"></div>', "player_board_" + playerId + "_firstPlayerWrapper");
            this.addTooltipHtml('firstPlayerToken', _("First Player token. Player with this token will start the next turn"));
        }
    };
    Azul.prototype.displayScoringOnTile = function (tile, playerId, points) {
        // create a div over tile, same position and width, but no overflow hidden (that must be kept on tile for glowing effect)
        dojo.place("<div id=\"tile" + tile.id + "-scoring\" class=\"scoring-tile\"></div>", "player-table-" + playerId + "-wall-spot-" + tile.line + "-" + tile.column);
        this.displayScoring("tile" + tile.id + "-scoring", this.getPlayerColor(Number(playerId)), points, SCORE_MS);
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
            ['factoriesFilled', ANIMATION_MS],
            ['tilesSelected', ANIMATION_MS],
            ['undoTakeTiles', ANIMATION_MS],
            ['tilesPlacedOnLine', ANIMATION_MS],
            ['undoSelectLine', ANIMATION_MS],
            ['placeTileOnWall', this.gamedatas.fastScoring ? SCORE_MS : SLOW_SCORE_MS],
            ['emptyFloorLine', this.gamedatas.fastScoring ? SCORE_MS : SLOW_SCORE_MS],
            ['endScore', this.gamedatas.fastScoring ? SCORE_MS : SLOW_SCORE_MS],
            ['firstPlayerToken', 1],
            ['lastRound', 1],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Azul.prototype.notif_factoriesFilled = function (notif) {
        this.factories.fillFactories(notif.args.factories, notif.args.remainingTiles);
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
        this.factories.undoTakeTiles(notif.args.undo.tiles, notif.args.undo.from).then(function () { return _this.getPlayerTable(notif.args.playerId).setHandVisible(false); });
    };
    Azul.prototype.notif_tilesPlacedOnLine = function (notif) {
        var _this = this;
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.discardedTiles, 0);
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
            completeLine.pointsDetail.columnTiles.forEach(function (tile) { return dojo.addClass("tile" + tile.id, 'highlight'); });
            setTimeout(function () { return completeLine.pointsDetail.columnTiles.forEach(function (tile) { return dojo.removeClass("tile" + tile.id, 'highlight'); }); }, SCORE_MS - 50);
            _this.removeTiles(completeLine.discardedTiles, true);
            _this.displayScoringOnTile(completeLine.placedTile, playerId, completeLine.pointsDetail.points);
            _this.incScore(Number(playerId), completeLine.pointsDetail.points);
        });
    };
    Azul.prototype.notif_emptyFloorLine = function (notif) {
        var _this = this;
        Object.keys(notif.args.floorLines).forEach(function (playerId) {
            var floorLine = notif.args.floorLines[playerId];
            _this.removeTiles(floorLine.tiles, true);
            _this.displayScoring("player-table-" + playerId + "-line0", _this.getPlayerColor(Number(playerId)), floorLine.points, SCORE_MS);
            _this.incScore(Number(playerId), floorLine.points);
        });
    };
    Azul.prototype.notif_endScore = function (notif) {
        var _this = this;
        Object.keys(notif.args.scores).forEach(function (playerId) {
            var endScore = notif.args.scores[playerId];
            endScore.tiles.forEach(function (tile) { return dojo.addClass("tile" + tile.id, 'highlight'); });
            setTimeout(function () { return endScore.tiles.forEach(function (tile) { return dojo.removeClass("tile" + tile.id, 'highlight'); }); }, SCORE_MS - 50);
            _this.displayScoringOnTile(endScore.tiles[2], playerId, endScore.points);
            _this.incScore(Number(playerId), endScore.points);
        });
    };
    Azul.prototype.notif_firstPlayerToken = function (notif) {
        this.placeFirstPlayerToken(notif.args.playerId);
    };
    Azul.prototype.notif_lastRound = function () {
        if (document.getElementById('last-round')) {
            return;
        }
        dojo.place("<div id=\"last-round\">\n            " + _("This is the last round of the game!") + "\n        </div>", 'page-title');
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Azul.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (typeof args.lineNumber === 'number') {
                    args.lineNumber = "<strong>" + args.line + "</strong>";
                }
                if (log.indexOf('${number} ${color}') !== -1 && typeof args.type === 'number') {
                    var number = args.number;
                    var html = '';
                    for (var i = 0; i < number; i++) {
                        html += "<div class=\"tile tile" + args.type + "\"></div>";
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
