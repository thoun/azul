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
}

interface AzulGame extends Game {
    isVariant(): boolean;
    takeTiles(id: number): void;
    selectLine(line: number): void;
    selectColumn(column: number): void;
    removeTile(tile: Tile): void;
    removeTiles(tiles: Tile[]): void;
    placeTile(tile: Tile, destinationId: string, left: number, top: number): void;
}

interface EnteringChooseLineArgs {
    lines: number[];
}

interface EnteringChooseColumnArgs {
    line: number;
    columns: { [playerId: number]: number[] };
}

interface NotifFirstPlayerTokenArgs {
    playerId: number;
}

interface NotifFactoriesFilledArgs {
    factories: { [factoryId: number]: Tile[] };
}

interface NotifTilesSelectedArgs {
    playerId: number;
    selectedTiles: Tile[];
    discardedTiles: Tile[];
}

interface NotifTilesPlacedOnLineArgs {
    playerId: number;
    line: number;
    placedTiles: Tile[];
    discardedTiles: Tile[];
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
    x: number;
    y: number;
}