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

use Bga\GameFramework\GameStateBuilder;

require_once("modules/php/constants.inc.php");

$machinestates = [
    ST_BGA_GAME_SETUP => GameStateBuilder::gameSetup(ST_FILL_FACTORIES)->build(),

    ST_PLAYER_CHOOSE_TILE => [
        "name" => "chooseTile",
        "description" => clienttranslate('${actplayer} must choose tiles'),
        "descriptionmyturn" => clienttranslate('${you} must choose tiles'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "takeTiles",

            "actTakeTiles",
        ],
        "transitions" => [
            "placeTiles" => ST_PLAYER_CHOOSE_LINE,
            "chooseFactory" => ST_PLAYER_CHOOSE_FACTORY,
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_CHOOSE_FACTORY => [
        "name" => "chooseFactory",
        "description" => clienttranslate('${actplayer} must choose a neighbor factory to place remaining ${number} ${color}'),
        "descriptionmyturn" => clienttranslate('${you} must choose a neighbor factory to place remaining ${number} ${color}'),
        "type" => "activeplayer",
        "args" => "argChooseFactory",
        "possibleactions" => [ 
            "selectFactory",
            "undoTakeTiles",

            "actSelectFactory",
            "actUndoTakeTiles",
         ],
        "transitions" => [
            "nextFactory" => ST_PLAYER_CHOOSE_FACTORY,
            "chooseLine" => ST_PLAYER_CHOOSE_LINE,
            "nextPlayer" => ST_NEXT_PLAYER,
            "undo" => ST_PLAYER_CHOOSE_TILE,
        ],
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

            "actSelectLine",
            "actUndoTakeTiles",
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

            "actConfirmLine",
            "actUndoSelectLine",
         ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
            "undo" => ST_PLAYER_CHOOSE_LINE,
        ],
    ],

    ST_MULTIPLAYER_PRIVATE_CHOOSE_COLUMNS => [
        "name" => "multiChooseColumns",
        "description" => clienttranslate('Players with complete lines must choose columns to place tiles'),
        "descriptionmyturn" => clienttranslate('${you} must must choose columns to place tiles'),
        "type" => "multipleactiveplayer",
        "initialprivate" => ST_PRIVATE_CHOOSE_COLUMNS,
        "action" => "stMultiChooseColumns",
        "possibleactions" => [ 
        ],
        "transitions" => [
            "confirmColumns" => ST_PLACE_TILES,
        ],
    ],

    ST_PRIVATE_CHOOSE_COLUMNS => [
        "name" => "privateChooseColumns",
        "descriptionmyturn" => clienttranslate('${you} must must choose columns to place tiles'),
        "type" => "private",
        "action" => "stPrivateChooseColumns",
        "args" => "argChooseColumnForPlayer",
        "possibleactions" => [
            "selectColumn",
            "confirmColumns",
            "undoColumns",

            "actSelectColumn",
            "actConfirmColumns",
            "actUndoColumns",
        ],
        "transitions" => [
            "next" => ST_PRIVATE_CHOOSE_COLUMNS,
            "undo" => ST_PRIVATE_CHOOSE_COLUMNS,
            "confirm" => ST_PRIVATE_CONFIRM_COLUMNS,
        ],
    ],

    ST_PRIVATE_CONFIRM_COLUMNS => [
        "name" => "privateConfirmColumns",
        "descriptionmyturn" => clienttranslate('${you} must must choose columns to place tiles'),
        "type" => "private",
        "args" => "argChooseColumnForPlayer",
        "possibleactions" => [
            "confirmColumns",
            "undoColumns",
            
            "actConfirmColumns",
            "actUndoColumns",
        ],
        "transitions" => [
            "undo" => ST_PRIVATE_CHOOSE_COLUMNS,
            "confirmColumns" => ST_PLACE_TILES,
        ],
    ],
];
