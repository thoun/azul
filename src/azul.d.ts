interface Tile {
    id: number;
    type: number;
    location: string;
    line: number;
    column: number;
}

interface AzulPlayer extends Player {
    lines: Tile[];
    wall: Tile[];
    hand: Tile[];
    playerNo: number;
    selectedColumns: SelectedColumn[];
}

/**
 * Your game interfaces
 */

interface AzulGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: AzulPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    factoryNumber: number;
    factories: { [factoryId: number]: Tile[] };
    firstPlayerTokenPlayerId: number;
    variant: boolean;
    endRound: boolean;
    undo: boolean;
    fastScoring: boolean;
    remainingTiles: number;

    specialFactories?: { [factoryNumber: number]: number };
}

interface AzulGame extends Game {
    getPlayerId(): number;
    isDefaultFont(): boolean;
    getZoom(): number;
    isVariant(): boolean;
    takeTiles(id: number): void;
    selectLine(line: number): void;
    selectColumn(line: number, column: number): void;
    removeTile(tile: Tile): void;
    removeTiles(tiles: Tile[]): void;
    placeTile(tile: Tile, destinationId: string, left?: number, top?: number, rotation?: number): Promise<boolean>;
}

interface EnteringChooseLineArgs {
    lines: number[];
}

interface NextColumnToSelect {
    availableColumns: number[];
    color: number;
    line: number;
}

interface SelectedColumn {
    column: number;
    color: number;
    line: number;

}

interface ChooseColumnsForPlayer {
    nextColumnToSelect?: NextColumnToSelect;
    selectedColumns: SelectedColumn[];
}


interface EnteringChooseColumnsArgs {
    players: { [playerId: number]: ChooseColumnsForPlayer };
}

interface NotifUpdateSelectColumnArgs {
    playerId: number;
    arg: ChooseColumnsForPlayer;
    undo: boolean;
}

interface NotifFirstPlayerTokenArgs {
    playerId: number;
}

interface NotifFactoriesFilledArgs {
    factories: { [factoryId: number]: Tile[] };
    remainingTiles: number;
}

interface NotifTilesSelectedArgs {
    playerId: number;
    selectedTiles: Tile[];
    discardedTiles: Tile[];
    fromFactory: number;
}

interface UndoSelect {
    from: number;
    tiles: Tile[];
    previousFirstPlayer: number;
    lastRoundBefore: boolean;
}

interface NotifUndoArgs {
    playerId: number;
    undo: UndoSelect;
}

interface NotifTilesPlacedOnLineArgs {
    playerId: number;
    line: number;
    placedTiles: Tile[];
    discardedTiles: Tile[];
    fromHand: boolean;
}

interface WallTilePointDetail {
    points: number;
    rowTiles: Tile[];
    columnTiles: Tile[];
}

interface PlacedTileOnWall {
    placedTile: Tile;
    discardedTiles: Tile[];
    pointsDetail: WallTilePointDetail;
}

interface NotifPlaceTileOnWallArgs {
    completeLines: { [playerId: number]: PlacedTileOnWall };
}

interface FloorLine {
    points: number;
    tiles: Tile[];
}

interface NotifEmptyFloorLineArgs {
    floorLines: { [playerId: number]: FloorLine };
}

interface EndScoreTiles {
    tiles: Tile[];
    points: number;
}

interface NotifEndScoreArgs {
    scores: { [playerId: number]: EndScoreTiles };
}

interface PlacedTile {
    id?: number;
    x: number;
    y: number;
}