function slideToObjectAndAttach(game, object, destinationId, posX, posY) {
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return;
    }
    object.style.zIndex = '10';
    var animation = (posX || posY) ?
        game.slideToObjectPos(object, destinationId, posX, posY) :
        game.slideToObject(object, destinationId);
    dojo.connect(animation, 'onEnd', dojo.hitch(this, function () {
        object.style.top = 'unset';
        object.style.left = 'unset';
        object.style.position = 'relative';
        object.style.zIndex = 'unset';
        destination.appendChild(object);
    }));
    animation.play();
}
var FACTORY_RADIUS = 125;
var Factories = /** @class */ (function () {
    function Factories(game, factoryNumber, factories) {
        this.game = game;
        this.factoryNumber = factoryNumber;
        var factoriesDiv = document.getElementById('factories');
        var radius = 40 + factoryNumber * 40;
        var centerX = factoriesDiv.clientWidth / 2;
        var centerY = radius + FACTORY_RADIUS;
        factoriesDiv.style.height = centerY * 2 + "px";
        var html = "<div>";
        html += "<div id=\"factory0\" class=\"factory-center\" style=\"left: " + (centerX - radius + FACTORY_RADIUS) + "px; top: " + (centerY - radius + FACTORY_RADIUS) + "px; width: " + (radius - FACTORY_RADIUS) + "px; height: " + (radius - FACTORY_RADIUS) + "px;\"></div>";
        for (var i = 1; i <= factoryNumber; i++) {
            var angle = (i - 1) * Math.PI * 2 / factoryNumber; // in radians
            var left = radius * Math.sin(angle);
            var top_1 = radius * Math.cos(angle);
            html += "<div id=\"factory" + i + "\" class=\"factory\" style=\"left: " + (centerX - FACTORY_RADIUS + left) + "px; top: " + (centerY - FACTORY_RADIUS - top_1) + "px;\"></div>";
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
                dojo.place("<div id=\"tile" + tile.id + "\" class=\"tile tile" + tile.type + "\" style=\"left: " + (50 + Math.floor(index / 2) * 90) + "px; top: " + (50 + Math.floor(index % 2) * 90) + "px;\"></div>", "factory" + i);
                document.getElementById("tile" + tile.id).addEventListener('click', function () { return _this.game.takeTiles(tile.id); });
            });
        };
        for (var i = 0; i <= this.factoryNumber; i++) {
            _loop_1(i);
        }
    };
    Factories.prototype.moveSelectedTiles = function (selectedTiles, discardedTiles) {
        var _this = this;
        selectedTiles.forEach(function (tile) { return _this.game.slideToObjectAndDestroy($("tile" + tile.id), 'topbar'); });
        discardedTiles.forEach(function (tile) { return slideToObjectAndAttach(_this.game, $("tile" + tile.id), 'factory0'); });
    };
    return Factories;
}());
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "<div id=\"player-table-wrapper-" + this.playerId + "\">\n        <div class=\"player-name\" style=\"color: #" + player.color + ";\">\n            " + player.name + "\n        </div>\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table\">";
        for (var i = 1; i <= 5; i++) {
            html += "<div id=\"player-table-" + this.playerId + "-line" + i + "\" class=\"line\" style=\"top: " + (10 + 70 * (i - 1)) + "px; width: " + (69 * i - 5) + "px;\"></div>";
        }
        html += "<div id=\"player-table-" + this.playerId + "-line0\" class=\"floor line\"></div>";
        html += "    </div>\n        </div>";
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
    }
    PlayerTable.prototype.placeTilesOnLine = function (tiles, line) {
        var _this = this;
        var top = line ? 0 : 43;
        tiles.forEach(function (tile) {
            if (document.getElementById("tile" + tile.id)) {
                dojo.destroy("tile" + tile.id);
            }
            var position = line ? "right: " + (tile.column - 1) * 69 + "px" : "left: " + (3 + (tile.column - 1) * 74) + "px";
            dojo.place("<div id=\"tile" + tile.id + "\" class=\"tile tile" + tile.type + "\" style=\"" + position + "; top: " + top + "px;\"></div>", "player-table-" + _this.playerId + "-line" + line);
        });
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
    Azul.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Azul.prototype.createPlayerPanels = function (gamedatas) {
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            /*            const playerTable = Object.values(gamedatas.playersTables[playerId]);
            
                        // Lord & pearl counters
            
                        dojo.place(`<div class="counters">
                            <div id="lord-counter-wrapper-${player.id}" class="lord-counter"></div>
                            <div id="pearl-counter-wrapper-${player.id}" class="pearl-counter">
                                <div class="token pearl"></div>
                                <span id="pearl-counter-${player.id}" class="left"></span>
                            </div>
                        </div>`, `player_board_${player.id}`);
            
                        this.minimaps[playerId] = new Minimap(playerId, playerTable);
            
                        const pearlCounter = new ebg.counter();
                        pearlCounter.create(`pearl-counter-${player.id}`);
                        pearlCounter.setValue((player as any).pearls);
                        this.pearlCounters[playerId] = pearlCounter;
            
                        // keys counters
            
                        dojo.place(`<div class="counters">
                            <div id="silver-key-counter-wrapper-${player.id}" class="key-counter silver-key-counter">
                                <div id="silver-key-${player.id}" class="token silver key"></div>
                                <span id="silver-key-counter-${player.id}" class="left"></span>
                            </div>
                            <div id="gold-key-counter-wrapper-${player.id}" class="key-counter gold-key-counter">
                                <div id="gold-key-${player.id}"  class="token gold key"></div>
                                <span id="gold-key-counter-${player.id}" class="left"></span>
                            </div>
                        </div>`, `player_board_${player.id}`);
            
                        const lastLocationSpotIndex = playerTable.map((spot: PlayerTableSpot, spotIndex: number) => spot.location ? spotIndex : -1).reduce((a, b) => a > b ? a : b, -1);
            
                        const silverKeyAvailable = playerTable.filter((spot: PlayerTableSpot, spotIndex: number) => spotIndex > lastLocationSpotIndex && spot.lord?.key === 1).length > 0;
                        dojo.toggleClass(`silver-key-counter-wrapper-${player.id}`, 'available', silverKeyAvailable);
                        const silverKeyCounter = new ebg.counter();
                        silverKeyCounter.create(`silver-key-counter-${player.id}`);
                        silverKeyCounter.setValue(playerTable.filter((spot: PlayerTableSpot) => spot.lord?.key === 1).length);
                        this.silverKeyCounters[playerId] = silverKeyCounter;
            
                        const goldKeyAvailable = playerTable.filter((spot: PlayerTableSpot, spotIndex: number) => spotIndex > lastLocationSpotIndex && spot.lord?.key === 2).length > 0;
                        dojo.toggleClass(`gold-key-counter-wrapper-${player.id}`, 'available', goldKeyAvailable);
                        const goldKeyCounter = new ebg.counter();
                        goldKeyCounter.create(`gold-key-counter-${player.id}`);
                        goldKeyCounter.setValue(playerTable.filter((spot: PlayerTableSpot) => spot.lord?.key === 2).length);
                        this.goldKeyCounters[playerId] = goldKeyCounter;
            
                        // top lord tokens
            
                        let html = `<div class="top-lord-tokens">`;
                        GUILD_IDS.forEach(guild => html += `<div class="token guild${guild} token-guild${guild}" id="top-lord-token-${guild}-${player.id}"></div>`);
                        html += `</div>`;
                        dojo.place(html, `player_board_${player.id}`);
            
                        // pearl master token
                        dojo.place(`<div id="player_board_${player.id}_pearlMasterWrapper" class="pearlMasterWrapper"></div>`, `player_board_${player.id}`);
            
                        if (gamedatas.pearlMasterPlayer === playerId) {
                            this.placePearlMasterToken(gamedatas.pearlMasterPlayer);
                        }
            
                        this.setNewScore({
                            playerId,
                            newScore: (player as any).newScore
                        });*/
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
    /*placePearlMasterToken(playerId: number) {
        const pearlMasterToken = document.getElementById('pearlMasterToken');
        if (pearlMasterToken) {
            slideToObjectAndAttach(this, pearlMasterToken, `player_board_${playerId}_pearlMasterWrapper`);
        } else {
            dojo.place('<div id="pearlMasterToken" class="token"></div>', `player_board_${playerId}_pearlMasterWrapper`);

            (this as any).addTooltipHtml('pearlMasterToken', _("Pearl Master token. At the end of the game, the player possessing the Pearl Master token gains a bonus of 5 Influence Points."));
        }
    }*/
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    Azul.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
            ['factoriesFilled', ANIMATION_MS],
            ['tilesSelected', ANIMATION_MS],
            ['tilesPlacedOnLine', ANIMATION_MS],
            /*['extraLordRevealed', ANIMATION_MS],
            ['locationPlayed', ANIMATION_MS],
            ['discardLords', ANIMATION_MS],
            ['discardLocations', ANIMATION_MS],
            ['newPearlMaster', 1],
            ['discardLordPick', 1],
            ['discardLocationPick', 1],
            ['lastTurn', 1],
            ['scoreLords', SCORE_MS],
            ['scoreLocations', SCORE_MS],
            ['scoreCoalition', SCORE_MS],
            ['scorePearlMaster', SCORE_MS],
            ['scoreTotal', SCORE_MS],*/
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
        this.factories.moveSelectedTiles(notif.args.selectedTiles, notif.args.discardedTiles);
    };
    Azul.prototype.notif_tilesPlacedOnLine = function (notif) {
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.tiles, notif.args.line);
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
