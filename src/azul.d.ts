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
}

interface AzulGame extends Game {
    takeTiles(id: number): void;
    selectLine(line: number): void;
    removeTile(tile: Tile): void;
    removeTiles(tiles: Tile[]): void;
}

interface EnteringChooseLineArgs {
    lines: number[];
}

interface NotifFactoriesFilledArgs {
    factories: { [factoryId: number]: Tile[] };
}

interface NotifTilesSelectedArgs {
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

interface CompleteLine {
    placedTile: Tile;
    discardedTiles: Tile[];
    pointsDetail: WallTilePointDetail;
}

interface NotifPlaceTileOnWallArgs {
    completeLines: { [playerId: number]: CompleteLine };
}

interface FloorLine {
    points: number;
    tiles: Tile[];
}

interface NotifEmptyFloorLineArgs {
    floorLines: { [playerId: number]: FloorLine };
}