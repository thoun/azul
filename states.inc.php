<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Azul implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * 
 * states.inc.php
 *
 * Azul game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!


require_once("modules/constants.inc.php");

$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => [ "" => ST_FILL_FACTORIES ]
    ],

    ST_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "transitions" => [
            "nextPlayer" => ST_PLAYER_CHOOSE_TILE, 
            "endRound" => ST_END_ROUND,
        ],
    ],
   
    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];

$playerActionsGameStates = [

    ST_FILL_FACTORIES => [
        "name" => "fillFactories",
        "description" => "",
        "type" => "game",
        "updateGameProgression" => true,
        "action" => "stFillFactories",
        "transitions" => [ 
            "next" => ST_PLAYER_CHOOSE_TILE,
        ],
    ],

    ST_PLAYER_CHOOSE_TILE => [
        "name" => "chooseTile",
        "description" => clienttranslate('${actplayer} must choose tiles'),
        "descriptionmyturn" => clienttranslate('${you} must choose tiles'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "takeTiles" 
        ],
        "transitions" => [
            "placeTiles" => ST_PLAYER_CHOOSE_LINE,
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_CHOOSE_LINE => [
        "name" => "chooseLine",
        "description" => clienttranslate('${actplayer} must choose a line to place ${number} ${color}'),
        "descriptionmyturn" => clienttranslate('${you} must choose a line to place ${number} ${color}'),
        "type" => "activeplayer",
        "args" => "argChooseLine",
        "possibleactions" => [ 
            "selectLine",
            "undoTakeTiles",
         ],
        "transitions" => [
            "confirm" => ST_PLAYER_CONFIRM_LINE,
            "nextPlayer" => ST_NEXT_PLAYER,
            "undo" => ST_PLAYER_CHOOSE_TILE,
        ],
    ],

    ST_PLAYER_CONFIRM_LINE => [
        "name" => "confirmLine",
        "description" => clienttranslate('${actplayer} must confirm line choice'),
        "descriptionmyturn" => clienttranslate('${you} must confirm line choice'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "confirmLine",
            "undoSelectLine",
         ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
            "undo" => ST_PLAYER_CHOOSE_LINE,
        ],
    ],

    ST_END_ROUND => [
        "name" => "endRound",
        "description" => "",
        "type" => "game",
        "action" => "stEndRound",
        "transitions" => [
            "chooseColumns" => ST_MULTIPLAYER_CHOOSE_COLUMNS,
            "placeTiles" => ST_PLACE_TILES,
        ],
    ],

    ST_MULTIPLAYER_CHOOSE_COLUMNS => [
        "name" => "chooseColumns",
        "description" => clienttranslate('Players with complete lines must choose columns to place tiles'),
        "descriptionmyturn" => clienttranslate('${you} must must choose columns to place tiles'),
        "type" => "multipleactiveplayer",
        "action" => "stChooseColumns",
        "args" => "argChooseColumns",
        "possibleactions" => [ 
            "selectColumn",
            "confirmColumns",
            "undoColumns"
        ],
        "transitions" => [
            "confirmColumns" => ST_PLACE_TILES,
        ],
    ],

    ST_PLACE_TILES => [
        "name" => "placeTiles",
        "description" => "",
        "type" => "game",
        "action" => "stPlaceTiles",
        "transitions" => [ 
            "newRound" => ST_FILL_FACTORIES,
            "endScore" => ST_END_SCORE,
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "transitions" => [
            "endGame" => ST_END_GAME,
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates;
