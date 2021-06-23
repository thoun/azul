interface Tile {
    id: number;
    type: number;
    location: string;
    line: number;
    column: number;
}

interface AzulPlayer extends Player {
    lines: Tile[];
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
    tiles: Tile[];
    line: number;
}