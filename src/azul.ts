declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;
const SCORE_MS = 1500;

const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };

class Azul implements AzulGame {
    private gamedatas: AzulGamedatas;

    private factories: Factories;
    private playersTables: PlayerTable[] = [];

    constructor() {     
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

    public setup(gamedatas: AzulGamedatas) {
        // ignore loading of some pictures
        /*(this as any).dontPreloadImage('eye-shadow.png');
        (this as any).dontPreloadImage('publisher.png');
        [1,2,3,4,5,6,7,8,9,10].filter(i => !Object.values(gamedatas.players).some(player => Number((player as any).mat) === i)).forEach(i => (this as any).dontPreloadImage(`playmat_${i}.jpg`));
*/
        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.createPlayerPanels(gamedatas);
        this.factories = new Factories(this, gamedatas.factoryNumber, gamedatas.factories);
        this.createPlayerTables(gamedatas);

        this.setupNotifications();

        log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        log( 'Entering state: '+stateName , args.args );

        switch (stateName) {
            case 'chooseTile':
                this.onEnteringChooseTile();
                break;
            case 'chooseLine':
                this.onEnteringChooseLine(args.args);
                break;
        }
    }
    
    /*private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`; 
        (this as any).updatePageTitle();        
    }*/

    onEnteringChooseTile() {
        if ((this as any).isCurrentPlayerActive()) {
            dojo.addClass('factories', 'selectable');
        }
    }

    onEnteringChooseLine(args: EnteringChooseLineArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            args.lines.forEach(i => dojo.addClass(`player-table-${this.getPlayerId()}-line${i}`, 'selectable'));
        }
    }

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'chooseTile':
                this.onLeavingChooseTile();
                break;
            case 'chooseLine':
                this.onLeavingChooseLine();
                break;
        }
    }

    onLeavingChooseTile() {
        dojo.removeClass('factories', 'selectable');
    }

    onLeavingChooseLine() {
        for (let i=0; i<=5; i++) {
            dojo.removeClass(`player-table-${this.getPlayerId()}-line${i}`, 'selectable');
        }
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                /*case 'lordSwap':
                (this as any).addActionButton('swap_button', _("Swap"), 'onSwap');
                (this as any).addActionButton('dontSwap_button', _("Don't swap"), 'onDontSwap', null, false, 'red');
                dojo.addClass('swap_button', 'disabled');
                break;*/
            }

        }
    } 
    

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private createPlayerPanels(gamedatas: AzulGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);
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
    }

    private createPlayerTables(gamedatas: AzulGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;

        orderedPlayers.forEach(player => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
    }

    private createPlayerTable(gamedatas: AzulGamedatas, playerId: number) {
        this.playersTables.push(new PlayerTable(this, gamedatas.players[playerId]/*, gamedatas.playersTables[playerId]*/));
    }

    

    public selectLine(line: number) {
        if(!(this as any).checkAction('selectLine')) {
            return;
        }

        this.takeAction('selectLine', {
            line
        });
    }

    public takeTiles(id: number) {
        if(!(this as any).checkAction('takeTiles')) {
            return;
        }

        this.takeAction('takeTiles', {
            id
        });
    }

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/azul/azul/${action}.html`, data, this, () => {});
    }

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
    setupNotifications() {
        //log( 'notifications subscriptions setup' );

        const notifs = [
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
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_factoriesFilled(notif: Notif<NotifFactoriesFilledArgs>) {
        this.factories.fillFactories(notif.args.factories);
    }

    notif_tilesSelected(notif: Notif<NotifTilesSelectedArgs>) {
        this.factories.moveSelectedTiles(notif.args.selectedTiles, notif.args.discardedTiles);
    }

    notif_tilesPlacedOnLine(notif: Notif<NotifTilesPlacedOnLineArgs>) {
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.tiles, notif.args.line);
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    /*public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                // Representation of the color of a card
                if (args.guild !== undefined && args.guild_name !== undefined && args.guild_name[0] !== '<') {
                    args.guild_name = `<span class='log-guild-name' style='color: ${LOG_GUILD_COLOR[args.guild]}'>${_(args.guild_name)}</span>`;
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }*/
}