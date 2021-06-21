var FACTORY_RADIUS = 125;
var Factories = /** @class */ (function () {
    function Factories(game, factoryNumber) {
        this.game = game;
        this.factoryNumber = factoryNumber;
        var factoriesDiv = document.getElementById('factories');
        var radius = 40 + factoryNumber * 40;
        var centerX = factoriesDiv.clientWidth / 2;
        var centerY = radius + FACTORY_RADIUS;
        factoriesDiv.style.height = centerY * 2 + "px";
        var html = "<div>";
        for (var i = 1; i <= factoryNumber; i++) {
            html += "<div id=\"factory" + i + "\" class=\"factory\" style=\"left: " + (centerX - FACTORY_RADIUS) + "px; top: " + (centerY - FACTORY_RADIUS) + "px; transform: rotate(" + (i - 1) * 360 / factoryNumber + "deg) translateY(-" + radius + "px);\"></div>";
        }
        html += "</div>";
        dojo.place(html, 'factories');
    }
    return Factories;
}());
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        this.game = game;
        this.playerId = Number(player.id);
        dojo.place("<div id=\"player-table-wrapper-" + this.playerId + "\">\n            <div class=\"player-name\" style=\"color: #" + player.color + ";\">\n                " + player.name + "\n            </div>\n            <div id=\"player-table-" + this.playerId + "\" class=\"player-table\">\n            </div>\n        </div>", 'players-tables');
    }
    return PlayerTable;
}());
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
        this.factories = new Factories(this, gamedatas.factoryNumber);
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
            /*case 'lordStackSelection':
                const limitToHidden = (args.args as EnteringLordStackSelectionArgs).limitToHidden;
                this.setGamestateDescription(limitToHidden ? `limitToHidden${limitToHidden}` : '');
                this.onEnteringLordStackSelection(args.args);
                break;
            case 'lordSelection':
                const multiple = (args.args as EnteringLordSelectionArgs).multiple;
                const number = (args.args as EnteringLordSelectionArgs).lords?.length;
                this.setGamestateDescription(multiple ? (number > 1 ? 'multiple' : 'last') : '');
                this.onEnteringLordSelection(args.args);
                break;
            case 'lordPlacement':
                this.onEnteringLordPlacement(args.args);
                break;
            case 'lordSwap':
                this.onEnteringLordSwap();
                break;

            case 'locationStackSelection':
                const allHidden = (args.args as EnteringLocationStackSelectionArgs).allHidden;
                this.setGamestateDescription(allHidden ? 'allHidden' : '');
                this.onEnteringLocationStackSelection(args.args);
                break;
            case 'locationSelection':
                this.onEnteringLocationSelection(args.args);
                break;
            case 'addLocation':
                this.onEnteringLocationPlacement(args.args);
                break;

            case 'showScore':
                Object.keys(this.gamedatas.players).forEach(playerId => (this as any).scoreCtrl[playerId].setValue(0));
                this.onEnteringShowScore();
                break;*/
        }
    };
    Azul.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = "" + originalState['description' + property];
        this.gamedatas.gamestate.descriptionmyturn = "" + originalState['descriptionmyturn' + property];
        this.updatePageTitle();
    };
    /*onEnteringLordStackSelection(args: EnteringLordStackSelectionArgs) {
        this.lordsStacks.setMax(args.max);
        if ((this as any).isCurrentPlayerActive()) {
            this.lordsStacks.setSelectable(true, args.limitToHidden);
        }
    }*/
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Azul.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            /*case 'lordStackSelection':
                this.onLeavingLordStackSelection();
                break;
            case 'lordSelection':
                this.onLeavingLordSelection();
                break;
            case 'lordSwap':
                this.onLeavingLordSwap();
                break;

            case 'locationStackSelection':
                this.onLeavingLocationStackSelection();
                break;
            case 'locationSelection':
                this.onLeavingLocationSelection();
                break;*/
        }
    };
    /*onLeavingLordStackSelection() {
        this.lordsStacks.setSelectable(false, null);
    }*/
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
        var currentPlayer = Object.values(gamedatas.players).find(function (player) { return Number(player.id) === Number(_this.player_id); });
        if (currentPlayer) {
            this.createPlayerTable(gamedatas, Number(currentPlayer.id));
        }
        Object.values(gamedatas.players).filter(function (player) { return Number(player.id) !== Number(_this.player_id); }).forEach(function (player) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    Azul.prototype.createPlayerTable = function (gamedatas, playerId) {
        this.playersTables[playerId] = new PlayerTable(this, gamedatas.players[playerId] /*, gamedatas.playersTables[playerId]*/);
    };
    Azul.prototype.lordPick = function (id) {
        if (!this.checkAction('addLord')) {
            return;
        }
        this.takeAction('pickLord', {
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
        /*['lordPlayed', ANIMATION_MS],
        ['lordSwapped', ANIMATION_MS],
        ['extraLordRevealed', ANIMATION_MS],
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
