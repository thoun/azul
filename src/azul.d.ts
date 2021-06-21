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
    players: { [playerId: number]: Player };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    factoryNumber: number;
}

interface AzulGame extends Game {
}

/*interface EnteringStackSelectionArgs {
    max: number;
}*/

/*interface NotifDiscardLordPickArgs {
    discardedLords: Lord[];
}*/