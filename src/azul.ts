declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;
const SCORE_MS = 1500;

const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0];
const LOCAL_STORAGE_ZOOM_KEY = 'Azul-zoom';

const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };

class Azul implements AzulGame {
    private gamedatas: AzulGamedatas;

    private factories: Factories;
    private playersTables: PlayerTable[] = [];

    public zoom: number = 1;

    constructor() {    
        const zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
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

    public setup(gamedatas: AzulGamedatas) {
        // ignore loading of some pictures
        if (this.isVariant()) {
            (this as any).dontPreloadImage('playerboard.jpg');
        } else {
            (this as any).dontPreloadImage('playerboard-variant.jpg');
        }
        (this as any).dontPreloadImage('publisher.png');

        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.createPlayerPanels(gamedatas);
        this.factories = new Factories(this, gamedatas.factoryNumber, gamedatas.factories);
        this.createPlayerTables(gamedatas);

        this.setupNotifications();
        this.setupPreferences();

        if (gamedatas.endRound) {
            this.notif_lastRound();
        }

        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());

        (this as any).onScreenWidthChange = () => this.setAutoZoom();

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
            case 'gameEnd':
                const lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    }

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

    onEnteringChooseColumn(args: EnteringChooseColumnArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            const playerId = this.getPlayerId();
            args.columns[playerId].forEach(column => {
                this.getPlayerTable(playerId).handColor = args.colors[playerId];
                dojo.addClass(
                    column == 0 ? `player-table-${this.getPlayerId()}-column0` : `player-table-${this.getPlayerId()}-wall-spot-${args.line}-${column}`, 
                    'selectable'
                );
            });
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
            case 'chooseColumn':
                this.onLeavingChooseColumn();
                break;
        }
    }

    onLeavingChooseTile() {
        dojo.removeClass('factories', 'selectable');
    }

    onLeavingChooseLine() {
        if (!this.gamedatas.players[this.getPlayerId()]) {
            return;
        }

        for (let i=0; i<=5; i++) {
            dojo.removeClass(`player-table-${this.getPlayerId()}-line${i}`, 'selectable');
        }
    }

    onLeavingChooseColumn() {
        if (!this.gamedatas.players[this.getPlayerId()]) {
            return;
        }

        for (let line=1; line<=5; line++) {
            for (let column=1; column<=5; column++) {
                dojo.removeClass(`player-table-${this.getPlayerId()}-wall-spot-${line}-${column}`, 'selectable');
            }
        }
        dojo.removeClass(`player-table-${this.getPlayerId()}-column0`, 'selectable');
        
        Array.from(document.getElementsByClassName('ghost')).forEach(elem => elem.parentElement.removeChild(elem));
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if((this as any).isCurrentPlayerActive()) {
            switch (stateName) {                
                case 'chooseColumn': // for multiplayer states we have to do it here
                    this.onEnteringChooseColumn(args);
                    break;
            }
        }
    } 
    

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    private setupPreferences() {
        // Extract the ID and value from the UI control
        const onchange = (e) => {
          var match = e.target.id.match(/^preference_control_(\d+)$/);
          if (!match) {
            return;
          }
          var prefId = +match[1];
          var prefValue = +e.target.value;
          (this as any).prefs[prefId].value = prefValue;
          this.onPreferenceChange(prefId, prefValue);
        }
        
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        
        // Call onPreferenceChange() now
        dojo.forEach(
          dojo.query("#ingame_menu_content .preference_control"),
          el => onchange({ target: el })
        );
    }
      
    private onPreferenceChange(prefId: number, prefValue: number) {
        switch (prefId) {
            // KEEP
            case 201: 
                dojo.toggleClass('table', 'disabled-shimmer', prefValue == 2);
                break;
            case 202:
                dojo.toggleClass(document.getElementsByTagName('html')[0] as any, 'background2', prefValue == 2);
                break;
        }
    }

    public getZoom() {
        return this.zoom;
    }

    public setAutoZoom() {
        const zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;
        const factoryWidth = this.factories.getWidth();
        let newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth/newZoom < factoryWidth) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        // zoom will also place player tables. we call setZoom even if this method didn't change it because it might have been changed by localStorage zoom
        this.setZoom(newZoom);
    }    

    private setZoom(zoom: number = 1) {
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, ''+this.zoom);
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);

        const div = document.getElementById('table');
        const hands: HTMLDivElement[] = Array.from(document.getElementsByClassName('hand')) as HTMLDivElement[];
        if (zoom === 1) {
            div.style.transform = '';
            div.style.margin = '';
            hands.forEach(hand => {
                hand.style.transform = '';
                hand.style.margin = '';
            });
        } else {
            div.style.transform = `scale(${zoom})`;
            div.style.margin = `0 ${ZOOM_LEVELS_MARGIN[newIndex]}% ${(1-zoom)*-100}% 0`;
            hands.forEach(hand => {
                hand.style.transform = `scale(${zoom})`;
                hand.style.margin = `0 ${ZOOM_LEVELS_MARGIN[newIndex]}% 0 0`;
            });
        }

        document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;
    }

    public zoomIn() {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    public zoomOut() {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    public isVariant(): boolean {
        return this.gamedatas.variant;
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    private getPlayerColor(playerId: number): string {
        return this.gamedatas.players[playerId].color;
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private incScore(playerId: number, incScore: number) {
        if ((this as any).scoreCtrl[playerId]?.getValue() + incScore < 0) {
            (this as any).scoreCtrl[playerId]?.toValue(0);
        } else {
            (this as any).scoreCtrl[playerId]?.incValue(incScore);
        }
    }

    public placeTile(tile: Tile, destinationId: string, left?: number, top?: number, rotation?: number): Promise<boolean> {
        //this.removeTile(tile);
        //dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="left: ${left}px; top: ${top}px;"></div>`, destinationId);
        const tileDiv = document.getElementById(`tile${tile.id}`);
        if (tileDiv) {
            return slideToObjectAndAttach(this, tileDiv, destinationId, left, top, rotation);
        } else {
            dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="${left !== undefined ? `left: ${left}px;` : ''}${top !== undefined ? `top: ${top}px;` : ''}${rotation ? `transform: rotate(${rotation}deg)` : ''}" ${rotation ? `data-rotation='${rotation}'` : ''}></div>`, destinationId);
            return Promise.resolve(true);
        }
        
    }

    private createPlayerPanels(gamedatas: AzulGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);     

            // first player token
            dojo.place(`<div id="player_board_${player.id}_firstPlayerWrapper" class="firstPlayerWrapper disabled-shimmer"></div>`, `player_board_${player.id}`);

            if (gamedatas.firstPlayerTokenPlayerId === playerId) {
                this.placeFirstPlayerToken(gamedatas.firstPlayerTokenPlayerId);
            }
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

    public removeTile(tile: Tile, fadeOut?: boolean) {
        if (document.getElementById(`tile${tile.id}`)) {
            fadeOut ?
                (this as any).fadeOutAndDestroy(`tile${tile.id}`) :
                dojo.destroy(`tile${tile.id}`);
        }
    }

    public removeTiles(tiles: Tile[], fadeOut?: boolean) {
        tiles.forEach(tile => this.removeTile(tile, fadeOut));
    }

    public selectLine(line: number) {
        if(!(this as any).checkAction('selectLine')) {
            return;
        }

        this.takeAction('selectLine', {
            line
        });
    }

    public selectColumn(column: number) {
        if(!(this as any).checkAction('selectColumn')) {
            return;
        }

        this.takeAction('selectColumn', {
            column
        });

        this.onLeavingChooseColumn();
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

    placeFirstPlayerToken(playerId: number) {
        const firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            slideToObjectAndAttach(this, firstPlayerToken, `player_board_${playerId}_firstPlayerWrapper`);
        } else {
            dojo.place('<div id="firstPlayerToken" class="tile tile0"></div>', `player_board_${playerId}_firstPlayerWrapper`);

            (this as any).addTooltipHtml('firstPlayerToken', _("First Player token. Player with this token will start the next turn"));
        }
    }

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your azul.game.php file.

    */
    setupNotifications() {
        //log( 'notifications subscriptions setup' );

        const notifs = [
            ['factoriesFilled', ANIMATION_MS],
            ['tilesSelected', ANIMATION_MS],
            ['tilesPlacedOnLine', ANIMATION_MS],
            ['placeTileOnWall', SCORE_MS],
            ['emptyFloorLine', SCORE_MS],
            ['endScore', SCORE_MS],
            ['firstPlayerToken', 1],
            ['lastRound', 1],
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
        this.factories.centerColorRemoved(notif.args.selectedTiles[0].type)
        const table = this.getPlayerTable(notif.args.playerId);
        table.placeTilesOnHand(notif.args.selectedTiles);
        this.factories.discardTiles(notif.args.discardedTiles);
    }

    notif_tilesPlacedOnLine(notif: Notif<NotifTilesPlacedOnLineArgs>) {
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.discardedTiles, 0);
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.placedTiles, notif.args.line).then(
            () => { 
                if (notif.args.fromHand) {
                    this.getPlayerTable(notif.args.playerId).setHandVisible(false);
                }
            }
        );
    }

    notif_placeTileOnWall(notif: Notif<NotifPlaceTileOnWallArgs>) {
        Object.keys(notif.args.completeLines).forEach(playerId => {
            const completeLine: PlacedTileOnWall = notif.args.completeLines[playerId];
            
            this.getPlayerTable(Number(playerId)).placeTilesOnWall([completeLine.placedTile]);

            completeLine.pointsDetail.columnTiles.forEach(tile => dojo.addClass(`tile${tile.id}`, 'highlight'));
            setTimeout(() => completeLine.pointsDetail.columnTiles.forEach(tile => dojo.removeClass(`tile${tile.id}`, 'highlight')), SCORE_MS - 50);

            this.removeTiles(completeLine.discardedTiles, true);
            (this as any).displayScoring(`tile${completeLine.placedTile.id}`, this.getPlayerColor(Number(playerId)), completeLine.pointsDetail.points, SCORE_MS);
            this.incScore(Number(playerId), completeLine.pointsDetail.points);
        });
    }

    notif_emptyFloorLine(notif: Notif<NotifEmptyFloorLineArgs>) {
        Object.keys(notif.args.floorLines).forEach(playerId => {
            const floorLine: FloorLine = notif.args.floorLines[playerId];
            
            this.removeTiles(floorLine.tiles, true);
            (this as any).displayScoring(`player-table-${playerId}-line0`, this.getPlayerColor(Number(playerId)), floorLine.points, SCORE_MS);
            this.incScore(Number(playerId), floorLine.points);
        });
    }

    notif_endScore(notif: Notif<NotifEndScoreArgs>) {
        Object.keys(notif.args.scores).forEach(playerId => {
            const endScore: EndScoreTiles = notif.args.scores[playerId];

            endScore.tiles.forEach(tile => dojo.addClass(`tile${tile.id}`, 'highlight'));
            setTimeout(() => endScore.tiles.forEach(tile => dojo.removeClass(`tile${tile.id}`, 'highlight')), SCORE_MS - 50);

            (this as any).displayScoring(`tile${endScore.tiles[2].id}`, this.getPlayerColor(Number(playerId)), endScore.points, SCORE_MS);
            this.incScore(Number(playerId), endScore.points);
        });
    }

    notif_firstPlayerToken(notif: Notif<NotifFirstPlayerTokenArgs>) {
        this.placeFirstPlayerToken(notif.args.playerId);
    }

    notif_lastRound() {
        if (document.getElementById('last-round')) {
            return;
        }
        
        dojo.place(`<div id="last-round">
            ${_("This is the last round of the game!")}
        </div>`, 'page-title');
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                /*if (args.guild !== undefined && args.guild_name !== undefined && args.guild_name[0] !== '<') {
                    args.guild_name = `<span class='log-guild-name' style='color: ${LOG_GUILD_COLOR[args.guild]}'>${_(args.guild_name)}</span>`;
                }*/

                if (typeof args.lineNumber === 'number') {
                    args.lineNumber = `<strong>${args.line}</strong>`;
                }

                if (log.indexOf('${number} ${color}') !== -1 && typeof args.type === 'number') {
                    const number = args.number;
                    let html = '';
                    for (let i=0; i<number; i++) {
                        html += `<div class="tile tile${args.type}"></div>`;
                    }

                    log = log.replace('${number} ${color}', html);
                }
            }
            //console.log()${number} ${color}
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}