declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;
const SCORE_MS = 1500;
const SLOW_SCORE_MS = 2000;

const REFILL_DELAY = [];
REFILL_DELAY[5] = 1600;
REFILL_DELAY[7] = 2200;
REFILL_DELAY[9] = 2900;

const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const LOCAL_STORAGE_ZOOM_KEY = 'Azul-zoom';

const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };

class Azul implements AzulGame {
    private gamedatas: AzulGamedatas;

    private zoomManager: ZoomManager;
    private factories: Factories;
    private playersTables: PlayerTable[] = [];

    public zoom: number = 0.75;

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
            onDimensionsChange: (newZoom) => this.onTableCenterSizeChange(newZoom),
        });

        this.setupNotifications();
        this.setupPreferences();
        if (gamedatas.specialFactories) {
            document.getElementsByTagName('html')[0].dataset.chocolatierSkin = 'true';
            try {
                (document.getElementById('preference_control_203').closest(".preference_choice") as HTMLDivElement).style.display = 'none';
                (document.getElementById('preference_fontrol_203').closest(".preference_choice") as HTMLDivElement).style.display = 'none';
                (document.getElementById('preference_control_210').closest(".preference_choice") as HTMLDivElement).style.display = 'none';
                (document.getElementById('preference_fontrol_210').closest(".preference_choice") as HTMLDivElement).style.display = 'none';
            } catch (e) {}
            
            document.getElementById('factories').insertAdjacentHTML('beforeend', `<button type="button" id="special-factories-help">${_('Special Factories')}</button>`);
            document.getElementById('special-factories-help').addEventListener('click', () => this.showHelp());

            if (gamedatas.specialFactoryZeroOwner) {
                this.getPlayerTable(gamedatas.specialFactoryZeroOwner).setOwnSpecialFactoryZero(true);
                document.getElementById('factories').dataset.specialFactoryZeroOwned = 'true';
            }
        }

        if (gamedatas.endRound) {
            this.notif_lastRound();
        }

        log("Ending game setup");
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
            case 'privateChooseColumns':
                this.onEnteringChooseColumnsForPlayer(this.getPlayerId(), args.args, true);
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
            dojo.addClass(`player-table-${this.getPlayerId()}-line-1`, 'selectable');
        }
    }

    onEnteringChooseColumnsForPlayer(playerId: number, infos: ChooseColumnsForPlayer, privateMulti: boolean) {
        const table = this.getPlayerTable(playerId);

        infos.selectedColumns.forEach(selectedColumn => table.setGhostTile(selectedColumn.line, selectedColumn.column, selectedColumn.color));

        if ((this as any).isCurrentPlayerActive()) {
            const nextColumnToSelect = infos.nextColumnToSelect;
            if (nextColumnToSelect) {
                nextColumnToSelect.availableColumns.forEach(column =>
                    dojo.addClass(
                        /*column == 0 ? `player-table-${playerId}-column0` :*/ `player-table-${playerId}-wall-spot-${nextColumnToSelect.line}-${column}`, 
                        'selectable'
                    )
                );
            }
            
            if (!privateMulti) {
                if (!document.getElementById('confirmColumns_button')) {
                    (this as any).addActionButton('confirmColumns_button', _("Confirm"), () => this.confirmColumns());
                    (this as any).addActionButton('undoColumns_button', _("Undo column selection"), () => this.undoColumns(), null, null, 'gray');
                }
                dojo.toggleClass('confirmColumns_button', 'disabled', !!nextColumnToSelect);
            }
        }
    }

    onEnteringChooseColumns(args: EnteringChooseColumnsArgs) {
        const playerId = this.getPlayerId();
        const infos = args.players[playerId];
        if (infos) {
            this.onEnteringChooseColumnsForPlayer(playerId, infos, false);
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
            case 'chooseColumns':
                this.onLeavingChooseColumns();
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
        dojo.removeClass(`player-table-${this.getPlayerId()}-line-1`, 'selectable');
    }

    onLeavingChooseColumns() {        
        Array.from(document.getElementsByClassName('ghost')).forEach(elem => elem.parentElement.removeChild(elem));
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        log('onUpdateActionButtons', stateName, args);
        
        if((this as any).isCurrentPlayerActive()) {
            switch (stateName) {    
                case 'chooseLine':
                    if (this.gamedatas.undo) {
                        (this as any).addActionButton('undoTakeTiles_button', _("Undo tile selection"), () => this.undoTakeTiles());
                    }
                    break;     
                case 'confirmLine':
                    (this as any).addActionButton('confirmLine_button', _("Confirm"), () => this.confirmLine());
                    (this as any).addActionButton('undoSelectLine_button', _("Undo line selection"), () => this.undoSelectLine(), null, null, 'gray');
                    this.startActionTimer('confirmLine_button', 5);
                    break;
                case 'privateChooseColumns':
                case 'privateConfirmColumns':
                    const privateChooseColumnArgs = args as ChooseColumnsForPlayer;
                    (this as any).addActionButton('confirmColumns_button', _("Confirm"), () => this.confirmColumns());
                    (this as any).addActionButton('undoColumns_button', _("Undo column selection"), () => this.undoColumns(), null, null, 'gray');
                    dojo.toggleClass('confirmColumns_button', 'disabled', !!privateChooseColumnArgs.nextColumnToSelect && stateName != 'privateConfirmColumns');
                    break;
            }
        }
        
        switch (stateName) {
            case 'chooseColumns': // for multiplayer states we have to do it here
                this.onEnteringChooseColumns(args);
                break;
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

        try {
            (document.getElementById('preference_control_299').closest(".preference_choice") as HTMLDivElement).style.display = 'none';
            (document.getElementById('preference_fontrol_299').closest(".preference_choice") as HTMLDivElement).style.display = 'none';
        } catch (e) {}
    }
      
    private onPreferenceChange(prefId: number, prefValue: number) {
        switch (prefId) {
            // KEEP
            case 201: 
                dojo.toggleClass('table', 'disabled-shimmer', prefValue == 2);
                break;
            case 202:
                dojo.toggleClass(document.getElementsByTagName('html')[0] as any, 'background2', prefValue == 2);
                this.zoomManager.setZoomControlsColor(prefValue == 2 ? 'white' : 'black');
                break;
            case 203:
                dojo.toggleClass(document.getElementsByTagName('html')[0] as any, 'cb', prefValue == 1);
                break;
            case 205:
                dojo.toggleClass(document.getElementsByTagName('html')[0] as any, 'hide-tile-count', prefValue == 2);
                break;
            case 206: 
                this.playersTables.forEach(playerTable => playerTable.setFont(prefValue));
                break;
            case 210:
                const chocolatierSkin = prefValue == 1 || !!this.gamedatas.specialFactories;
                document.getElementsByTagName('html')[0].dataset.chocolatierSkin = chocolatierSkin.toString();

                try {
                    (document.getElementById('preference_control_203').closest(".preference_choice") as HTMLDivElement).style.display = chocolatierSkin ? 'none' : null;
                    (document.getElementById('preference_fontrol_203').closest(".preference_choice") as HTMLDivElement).style.display = chocolatierSkin ? 'none' : null;
                } catch (e) {}
                break;
            case 299: 
                this.toggleZoomNotice(prefValue == 1);
                break;
        }
    }

    private toggleZoomNotice(visible: boolean) {
        const elem = document.getElementById('zoom-notice');
        if (visible) {
            if (!elem) {
                dojo.place(`
                <div id="zoom-notice">
                    ${_("Use zoom controls to adapt players board size !")}
                    <div style="text-align: center; margin-top: 10px;"><a id="hide-zoom-notice">${_("Dismiss")}</a></div>
                    <div class="arrow-right"></div>
                </div>
                `, 'bga-zoom-controls');

                document.getElementById('hide-zoom-notice').addEventListener('click', () => {
                    const select = document.getElementById('preference_control_299') as HTMLSelectElement;
                    select.value = '2';
    
                    var event = new Event('change');
                    select.dispatchEvent(event);
                });
            }
        } else if (elem) {
            elem.parentElement.removeChild(elem);
        }
    }

    public isDefaultFont(): boolean {
        return Number((this as any).prefs[206].value) == 1;
    }

    private startActionTimer(buttonId: string, time: number) {
        if ((this as any).prefs[204]?.value === 2) {
            return;
        }

        const button = document.getElementById(buttonId);
 
        let actionTimerId = null;
        const _actionTimerLabel = button.innerHTML;
        let _actionTimerSeconds = time;
        const actionTimerFunction = () => {
            const button = document.getElementById(buttonId);
            if (button == null) {
                window.clearInterval(actionTimerId);
            } else if (_actionTimerSeconds-- > 1) {
                button.innerHTML = _actionTimerLabel + ' (' + _actionTimerSeconds + ')';
            } else {
                window.clearInterval(actionTimerId);
                button.click();
            }
        };
        actionTimerFunction();
        actionTimerId = window.setInterval(() => actionTimerFunction(), 1000);
    }

    public getZoom() {
        return this.zoom;
    }

    private onTableCenterSizeChange(newZoom: number) {
        this.zoom = newZoom;

        const maxWidth = document.getElementById('table').clientWidth;
        const factoriesWidth = document.getElementById('factories').clientWidth;
        const playerTableWidth = 780;
        const tablesMaxWidth = maxWidth - factoriesWidth;
     
        document.getElementById('centered-table').style.width = tablesMaxWidth < playerTableWidth * this.gamedatas.playerorder.length ?
            `${factoriesWidth + (Math.floor(tablesMaxWidth / playerTableWidth) * playerTableWidth)}px` : `unset`;
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
            dojo.place(`<div id="tile${tile.id}" class="tile tile${tile.type}" style="${left !== undefined ? `left: ${left}px;` : ''}${top !== undefined ? `top: ${top}px;` : ''}${rotation ? `transform: rotate(${rotation}deg)` : ''}" data-rotation="${rotation ?? 0}"></div>`, destinationId);
            const newTileDiv = document.getElementById(`tile${tile.id}`);
            newTileDiv.addEventListener('click', () => {
                this.takeTiles(tile.id);
                this.factories.tileMouseLeave(tile.id);
            });
            newTileDiv.addEventListener('mouseenter', () => this.factories.tileMouseEnter(tile.id));
            newTileDiv.addEventListener('mouseleave', () => this.factories.tileMouseLeave(tile.id));

            return Promise.resolve(true);
        }
        
    }

    private removeColumnSelection() {
        if (!this.gamedatas.players[this.getPlayerId()]) {
            return;
        }

        for (let line=1; line<=5; line++) {
            for (let column=1; column<=5; column++) {
                dojo.removeClass(`player-table-${this.getPlayerId()}-wall-spot-${line}-${column}`, 'selectable');
            }
        }
        dojo.removeClass(`player-table-${this.getPlayerId()}-column0`, 'selectable');
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
        this.playersTables.push(new PlayerTable(this, gamedatas.players[playerId]));
    }

    public removeTile(tile: Tile, fadeOut?: boolean) {
        // we don't remove the FP tile, it just goes back to the center
        if (tile.type == 0) {
            const coordinates = this.factories.getCoordinatesForTile0();
            this.placeTile(tile, `factory0`, coordinates.left, coordinates.top, undefined);
        } else {
            const divElement = document.getElementById(`tile${tile.id}`);
            if (divElement) {
                if (fadeOut) {
                    const destroyedId = `${divElement.id}-to-be-destroyed`;
                    divElement.id = destroyedId;
                    (this as any).fadeOutAndDestroy(destroyedId);
                } else {
                    divElement.parentElement.removeChild(divElement);
                }
            }
        }
    }

    public removeTiles(tiles: Tile[], fadeOut?: boolean) {
        tiles.forEach(tile => this.removeTile(tile, fadeOut));
    }

    private showHelp() {
        const helpDialog = new ebg.popindialog();
        helpDialog.create('azulChocolatierVariantHelpDialog');
        helpDialog.setTitle(_("Special Factories"));

        let html = `
        <div id="help-popin">
            <div class="row">
                <div class="picture">
                    <div class="factory" data-special-factory="9"></div>
                </div>
                <span class="title">SF 1.</span> ${
                    _("After setting up the round, add 1 tile from the bag on this Special Factory display.")
                }
            </div>
            <div class="row">
                <div class="picture">
                    <div class="factory" data-special-factory="1"></div>
                    <div class="factory" data-special-factory="2"></div>
                    <div class="factory" data-special-factory="3"></div>
                    <div class="factory" data-special-factory="4"></div>
                    <div class="factory" data-special-factory="5"></div>
                </div>
                <span class="title">SF 2.</span> ${
                    _("After setting up the round, take 1 tile of the illustrated pattern from both adjacent Factory displays to the immediate left and right (if possible), and place them on this Special factory display.")
                }
            </div>
            <div class="row">
                <div class="picture">
                    <div class="factory" data-special-factory="8"></div>
                </div>
                <span class="title">SF 3.</span> ${
                    _("When a player picks tiles from this Special Factory display, the remaining tiles are not moved to the center of the table but remain on it.")
                }
            </div>
            <div class="row disabled">
                <div class="picture">
                    <div class="factory" data-special-factory="7"></div>
                </div>
                <span class="title">SF 4.</span> ${
                    _("When a player picks tiles from this Special Factory display, the remaining tiles are not moved to the center of the table. Instead, that player moves them to the Factory display (blue or gold) to its immediate left and/or right, dividing the tiles between those 2 displays. The only restriction is that tiles of one color may not be split up.")
                }
            </div>
            <div class="row">
                <div class="picture">
                    <div class="factory" data-special-factory="6"></div>
                </div>
                <span class="title">SF 5.</span> ${
                    _("When a player picks tiles from this Special Factory display, the remaining tiles are moved to the center of the table. Then, that player places this Special Factory as an extra space next to their Foundry line until the end of the round. The next tile that must be placed in their foundry line is placed on this Special factory instead, skipping the penalty.")
                }
            </div>
        </div>
        `;
        
        // Show the dialog
        helpDialog.setContent(html);

        helpDialog.show();
    }

    public takeTiles(id: number) {
        if(!(this as any).checkAction('takeTiles')) {
            return;
        }

        this.takeAction('takeTiles', {
            id
        });
    }

    public undoTakeTiles() {
        if(!(this as any).checkAction('undoTakeTiles')) {
            return;
        }

        this.takeAction('undoTakeTiles');
    }

    public selectLine(line: number) {
        if(!(this as any).checkAction('selectLine')) {
            return;
        }

        this.takeAction('selectLine', {
            line
        });
    }

    public confirmLine() {
        if(!(this as any).checkAction('confirmLine')) {
            return;
        }

        this.takeAction('confirmLine');
    }

    public undoSelectLine() {
        if(!(this as any).checkAction('undoSelectLine')) {
            return;
        }

        this.takeAction('undoSelectLine');
    }

    public selectColumn(line: number, column: number) {
        if(!(this as any).checkAction('selectColumn')) {
            return;
        }

        this.takeAction('selectColumn', {
            line,
            column
        });

        this.removeColumnSelection();
    }

    public confirmColumns() {
        if(!(this as any).checkAction('confirmColumns')) {
            return;
        }

        this.takeAction('confirmColumns');
    }

    public undoColumns() {
        if(!(this as any).checkAction('undoColumns')) {
            return;
        }

        this.takeAction('undoColumns');
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

    private displayScoringOnTile(tile: Tile, playerId: string | number, points: number) {
        // create a div over tile, same position and width, but no overflow hidden (that must be kept on tile for glowing effect)
        dojo.place(`<div id="tile${tile.id}-scoring" class="scoring-tile"></div>`, `player-table-${playerId}-wall-spot-${tile.line}-${tile.column}`);
        (this as any).displayScoring(`tile${tile.id}-scoring`, this.getPlayerColor(Number(playerId)), points, SCORE_MS);
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

        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_factoriesFilled(notif: Notif<NotifFactoriesFilledArgs>) {
        this.factories.fillFactories(notif.args.factories, notif.args.remainingTiles);
    }

    notif_factoriesChanged(notif: Notif<NotifFactoriesChangedArgs>) {
        this.factories.factoriesChanged(notif.args);
    }

    notif_factoriesCompleted(notif: Notif<NotifFactoriesChangedArgs>) {
        this.factories.factoriesCompleted(notif.args);
    }

    notif_tilesSelected(notif: Notif<NotifTilesSelectedArgs>) {
        if (notif.args.fromFactory == 0) {
            this.factories.centerColorRemoved(notif.args.selectedTiles[0].type);
        } else {
            this.factories.factoryTilesRemoved(notif.args.fromFactory);
        }
        const table = this.getPlayerTable(notif.args.playerId);
        table.placeTilesOnHand(notif.args.selectedTiles);
        this.factories.discardTiles(notif.args.discardedTiles);
    }

    notif_undoTakeTiles(notif: Notif<NotifUndoArgs>) {
        this.placeFirstPlayerToken(notif.args.undo.previousFirstPlayer);

        this.factories.undoTakeTiles(notif.args.undo.tiles, notif.args.undo.from, notif.args.factoryTilesBefore).then(
            () => this.getPlayerTable(notif.args.playerId).setHandVisible(false)
        );
    }

    notif_tilesPlacedOnLine(notif: Notif<NotifTilesPlacedOnLineArgs>) {
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.discardedTiles, 0);
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.discardedTilesToSpecialFactoryZero, -1);
        this.getPlayerTable(notif.args.playerId).placeTilesOnLine(notif.args.placedTiles, notif.args.line).then(
            () => { 
                if (notif.args.fromHand) {
                    this.getPlayerTable(notif.args.playerId).setHandVisible(false);
                }
            }
        );
    }

    notif_undoSelectLine(notif: Notif<NotifUndoArgs>) {
        const table = this.getPlayerTable(notif.args.playerId);
        table.placeTilesOnHand(notif.args.undo.tiles);

        if (document.getElementById('last-round') && !notif.args.undo.lastRoundBefore) {
            dojo.destroy('last-round');
        }
    }

    notif_placeTileOnWall(notif: Notif<NotifPlaceTileOnWallArgs>) {
        Object.keys(notif.args.completeLines).forEach(playerId => {
            const completeLine: PlacedTileOnWall = notif.args.completeLines[playerId];
            
            this.getPlayerTable(Number(playerId)).placeTilesOnWall([completeLine.placedTile]);

            completeLine.pointsDetail.columnTiles.forEach(tile => dojo.addClass(`tile${tile.id}`, 'highlight'));
            setTimeout(() => completeLine.pointsDetail.columnTiles.forEach(tile => dojo.removeClass(`tile${tile.id}`, 'highlight')), SCORE_MS - 50);

            this.removeTiles(completeLine.discardedTiles, true);
            this.displayScoringOnTile(completeLine.placedTile, playerId, completeLine.pointsDetail.points);
            this.incScore(Number(playerId), completeLine.pointsDetail.points);
        });
    }

    notif_emptyFloorLine(notif: Notif<NotifEmptyFloorLineArgs>) {
        Object.keys(notif.args.floorLines).forEach(playerId => {
            const floorLine: FloorLine = notif.args.floorLines[playerId];
            this.removeTiles(notif.args.specialFactoryZeroTiles[playerId], true);
            
            setTimeout(() => this.removeTiles(floorLine.tiles, true), SCORE_MS - 50);
            (this as any).displayScoring(`player-table-${playerId}-line0`, this.getPlayerColor(Number(playerId)), floorLine.points, SCORE_MS);
            this.incScore(Number(playerId), floorLine.points);
        });
    }

    notif_endScore(notif: Notif<NotifEndScoreArgs>) {
        Object.keys(notif.args.scores).forEach(playerId => {
            const endScore: EndScoreTiles = notif.args.scores[playerId];

            endScore.tiles.forEach(tile => dojo.addClass(`tile${tile.id}`, 'highlight'));
            setTimeout(() => endScore.tiles.forEach(tile => dojo.removeClass(`tile${tile.id}`, 'highlight')), SCORE_MS - 50);

            this.displayScoringOnTile(endScore.tiles[2], playerId, endScore.points);
            this.incScore(Number(playerId), endScore.points);
        });
    }

    notif_firstPlayerToken(notif: Notif<NotifFirstPlayerTokenArgs>) {
        this.placeFirstPlayerToken(notif.args.playerId);
    }

    notif_updateSelectColumn(notif: Notif<NotifUpdateSelectColumnArgs>) {
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
    }

    notif_lastRound() {
        if (document.getElementById('last-round')) {
            return;
        }
        
        let message = _("This is the last round of the game!");
        if (this.isVariant()) {
            message += ' <i>(' + _("if the complete line can be placed on the wall") + ')</i>';
        }
        dojo.place(`<div id="last-round">${message}</div>`, 'page-title');
    }

    notif_removeLastRound() {
        if (document.getElementById('last-round')) {
            dojo.destroy('last-round');
        }
    }

    notif_moveSpecialFactoryZero(notif: Notif<NotifFirstPlayerTokenArgs>) {
        document.getElementById('factories').dataset.specialFactoryZeroOwned = (!!notif.args.playerId).toString();
        this.playersTables.forEach(playerTable => playerTable.setOwnSpecialFactoryZero(notif.args.playerId == playerTable.playerId));
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (typeof args.lineNumber === 'number') {
                    args.lineNumber = `<strong>${args.line}</strong>`;
                }

                if (log.indexOf('${number} ${color}') !== -1 && typeof args.type === 'number') {

                    const number = args.number;
                    let html = '';
                    for (let i=0; i<number; i++) {
                        html += `<div class="tile tile${args.type}"></div>`;
                    }

                    log = _(log).replace('${number} ${color}', html);
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}