function slideToObjectAndAttach(game, object, destinationId, posX, posY) {
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return;
    }
    object.style.zIndex = '10';
    var animation = (posX !== undefined || posY !== undefined) ?
        game.slideToObjectPos(object, destinationId, posX, posY) :
        game.slideToObject(object, destinationId);
    dojo.connect(animation, 'onEnd', dojo.hitch(this, function () {
        object.style.top = posY !== undefined ? posY + "px" : 'unset';
        object.style.left = posX !== undefined ? posX + "px" : 'unset';
        object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
        object.style.zIndex = 'unset';
        destination.appendChild(object);
    }));
    animation.play();
}
var FACTORY_RADIUS = 125;
var HALF_TILE_SIZE = 29;
var Factories = /** @class */ (function () {
    function Factories(game, factoryNumber, factories) {
        this.game = game;
        this.factoryNumber = factoryNumber;
        var factoriesDiv = document.getElementById('factories');
        var radius = 40 + factoryNumber * 40;
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
        this.fillFactories(factories);
    }
    Factories.prototype.fillFactories = function (factories) {
        var _this = this;
        var _loop_1 = function (i) {
            var factory = factories[i];
            factory.forEach(function (tile, index) {
                var left = null;
                var top = null;
                if (i > 0) {
                    left = 50 + Math.floor(index / 2) * 90;
                    top = 50 + Math.floor(index % 2) * 90;
                }
                else {
                    if (tile.type == 0) {
                        var centerFactoryDiv = document.getElementById('factory0');
                        left = centerFactoryDiv.clientWidth / 2 - HALF_TILE_SIZE;
                        top = centerFactoryDiv.clientHeight / 2 - HALF_TILE_SIZE;
                    }
                    else {
                        var coords = _this.getFreePlaceForFactoryCenter();
                        left = coords.left;
                        top = coords.top;
                    }
                }
                _this.game.placeTile(tile, "factory" + i, left, top);
                document.getElementById("tile" + tile.id).addEventListener('click', function () { return _this.game.takeTiles(tile.id); });
            });
        };
        for (var i = 0; i <= this.factoryNumber; i++) {
            _loop_1(i);
        }
    };
    Factories.prototype.getFreePlaceForFactoryCenter = function () {
        var centerFactoryDiv = document.getElementById('factory0');
        var xCenter = centerFactoryDiv.clientWidth / 2;
        var yCenter = centerFactoryDiv.clientHeight / 2;
        var left = xCenter + Math.round(Math.random() * 120) - 60;
        var top = yCenter + Math.round(Math.random() * 120) - 60;
        return { left: left, top: top };
    };
    Factories.prototype.moveSelectedTiles = function (selectedTiles, discardedTiles, playerId) {
        var _this = this;
        selectedTiles.forEach(function (tile) { return slideToObjectAndAttach(_this.game, $("tile" + tile.id), "player_board_" + playerId); });
        discardedTiles.forEach(function (tile) {
            var _a = _this.getFreePlaceForFactoryCenter(), left = _a.left, top = _a.top;
            _this.game.placeTile(tile, 'factory0', left, top);
        });
        //selectedTiles.forEach(tile => (this.game as any).slideToObjectAndDestroy($(`tile${tile.id}`), 'topbar'));
        //discardedTiles.forEach(tile => slideToObjectAndAttach(this.game, $(`tile${tile.id}`), 'factory0'));
    };
    return Factories;
}());
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "<div id=\"player-table-wrapper-" + this.playerId + "\" class=\"player-table-wrapper\">\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table\" style=\"border-color: #" + player.color + ";\">";
        for (var i = 1; i <= 5; i++) {
            html += "<div id=\"player-table-" + this.playerId + "-line" + i + "\" class=\"line\" style=\"top: " + (10 + 70 * (i - 1)) + "px; width: " + (69 * i - 5) + "px;\"></div>";
        }
        html += "<div id=\"player-table-" + this.playerId + "-line0\" class=\"floor line\"></div>";
        html += "<div id=\"player-table-" + this.playerId + "-wall\" class=\"wall colored-side\"></div>";
        html += "    </div>\n        \n            <div class=\"player-name\" style=\"color: #" + player.color + ";\">" + player.name + "</div>\n            <div class=\"player-name dark\">" + player.name + "</div>\n        </div>";
        dojo.place(html, 'players-tables');
        var _loop_2 = function (i) {
            document.getElementById("player-table-" + this_1.playerId + "-line" + i).addEventListener('click', function () { return _this.game.selectLine(i); });
        };
        var this_1 = this;
        for (var i = 0; i <= 5; i++) {
            _loop_2(i);
        }
        var _loop_3 = function (i) {
            var tiles = player.lines.filter(function (tile) { return tile.line === i; });
            this_2.placeTilesOnLine(tiles, i);
        };
        var this_2 = this;
        for (var i = 0; i <= 5; i++) {
            _loop_3(i);
        }
        this.placeTilesOnWall(player.wall);
    }
    PlayerTable.prototype.placeTilesOnLine = function (tiles, line) {
        var _this = this;
        var top = line ? 0 : 45;
        tiles.forEach(function (tile) {
            var left = line ? (line - tile.column) * 69 : 5 + (tile.column - 1) * 74;
            _this.game.placeTile(tile, "player-table-" + _this.playerId + "-line" + line, left, top);
        });
    };
    PlayerTable.prototype.placeTilesOnWall = function (tiles) {
        var _this = this;
        tiles.forEach(function (tile) { return _this.game.placeTile(tile, "player-table-" + _this.playerId + "-wall", (tile.column - 1) * 69, (tile.line - 1) * 69); });
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
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var Azul = /** @class */ (function () {
    function Azul() {
        this.playersTables = [];
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
        // ignore loading of some pictures
        /*(this as any).dontPreloadImage('eye-shadow.png');
        (this as any).dontPreloadImage('publisher.png');
        [1,2,3,4,5,6,7,8,9,10].filter(i => !Object.values(gamedatas.players).some(player => Number((player as any).mat) === i)).forEach(i => (this as any).dontPreloadImage(`playmat_${i}.jpg`));
*/
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.createPlayerPanels(gamedatas);
        this.factories = new Factories(this, gamedatas.factoryNumber, gamedatas.factories);
        this.createPlayerTables(gamedatas);
        this.setupNotifications();
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
        }
    };
    /*private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`;
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }*/
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
        }
    };
    Azul.prototype.onLeavingChooseTile = function () {
        dojo.removeClass('factories', 'selectable');
    };
    Azul.prototype.onLeavingChooseLine = function () {
        for (var i = 0; i <= 5; i++) {
            dojo.removeClass("player-table-" + this.getPlayerId() + "-line" + i, 'selectable');
        }
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Azul.prototype.onUpdateActionButtons = function (stateName, args) {
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                /*case 'lordSwap':
                (this as any).addActionButton('swap_button', _("Swap"), 'onSwap');
                (this as any).addActionButton('dontSwap_button', _("Don't swap"), 'onDontSwap', null, false, 'red');
                dojo.addClass('swap_button', 'disabled');
                break;*/
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
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
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(incScore);
    };
    Azul.prototype.placeTile = function (tile, destinationId, left, top) {
        //this.removeTile(tile);
        //dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="left: ${left}px; top: ${top}px;"></div>`, destinationId);
        var tileDiv = document.getElementById("tile" + tile.id);
        if (tileDiv) {
            slideToObjectAndAttach(this, tileDiv, destinationId, left, top);
        }
        else {
            dojo.place("<div id=\"tile" + tile.id + "\" class=\"tile tile" + tile.type + "\" style=\"" + (left !== undefined ? "left: " + left + "px;" : '') + (top !== undefined ? "top: " + top + "px;" : '') + "\"></div>", destinationId);
        }
    };
    Azul.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // pearl master token
            dojo.place("<div id=\"player_board_" + player.id + "_firstPlayerWrapper\" class=\"firstPlayerWrapper\"></div>", "player_board_" + player.id);
            if (gamedatas.firstPlayerTokenPlayerId === playerId) {
                _this.placeFirstPlayerToken(gamedatas.firstPlayerTokenPlayerId);
            }
            player.hand.forEach(function (tile) { return _this.placeTile(tile, "player_board_" + playerId); });
        });
        /*(this as any).addTooltipHtmlToClass('lord-counter', _("Number of lords in player table"));
        (this as any).addTooltipHtmlToClass('pearl-counter', _("Number of pearls"));
        (this as any).addTooltipHtmlToClass('silver-key-counter', _("Number of silver keys (surrounded if a silver key is available)"));
        (this as any).addTooltipHtmlToClass('gold-key-counter', _("Number of gold keys (surrounded if a gold key is available)"));
        GUILD_IDS.forEach(guild => (this as any).addTooltipHtmlToClass(`token-guild${guild}`, _("The Coat of Arms token indicates the most influential Lord of each color.")));*/
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
        this.playersTables.push(new PlayerTable(this, gamedatas.players[playerId] /*, gamedatas.playersTables[playerId]*/));
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
    Azul.prototype.selectLine = function (line) {
        if (!this.checkAction('selectLine')) {
            return;
        }
        this.takeAction('selectLine', {
            line: line
        });
    };
    Azul.prototype.takeTiles = function (id) {
        if (!this.checkAction('takeTiles')) {
            return;
        }
        this.takeAction('takeTiles', {
            id: id
        });
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
            ['tilesPlacedOnLine', ANIMATION_MS],
            ['placeTileOnWall', SCORE_MS],
            ['emptyFloorLine', SCORE_MS],
            ['endScore', SCORE_MS],
            ['firstPlayerToken', 1],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Azul.prototype.notif_factoriesFilled = function (notif) {
        this.factories.fillFactories(notif.args.factories);
    };
    Azul.prototype.notif_tilesSelected = function (notif) {
        this.factories.moveSelectedTiles(notif.args.selectedTiles, notif.args.discardedTiles, notif.args.playerId);
    };
    Azul.prototype.notif_tilesPlacedOnLine = function (notif) {
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.placedTiles, notif.args.line);
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.discardedTiles, 0);
    };
    Azul.prototype.notif_placeTileOnWall = function (notif) {
        var _this = this;
        Object.keys(notif.args.completeLines).forEach(function (playerId) {
            var completeLine = notif.args.completeLines[playerId];
            _this.getPlayerTable(Number(playerId)).placeTilesOnWall([completeLine.placedTile]);
            completeLine.pointsDetail.columnTiles.forEach(function (tile) { return dojo.addClass("tile" + tile.id, 'highlight'); });
            setTimeout(function () { return completeLine.pointsDetail.columnTiles.forEach(function (tile) { return dojo.removeClass("tile" + tile.id, 'highlight'); }); }, SCORE_MS - 50);
            _this.removeTiles(completeLine.discardedTiles, true);
            _this.displayScoring("tile" + completeLine.placedTile.id, _this.getPlayerColor(Number(playerId)), completeLine.pointsDetail.points, SCORE_MS);
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
            _this.displayScoring("tile" + endScore.tiles[2].id, _this.getPlayerColor(Number(playerId)), endScore.points, SCORE_MS);
            _this.incScore(Number(playerId), endScore.points);
        });
    };
    Azul.prototype.notif_firstPlayerToken = function (notif) {
        this.placeFirstPlayerToken(notif.args.playerId);
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
