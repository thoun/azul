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
 * gameoptions.inc.php
 *
 * Azul game options description
 * 
 * In this file, you can define your game options (= game variants).
 *   
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in azul.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

$game_options = [
    
    // note: game variant ID should start at 100 (ie: 100, 101, 102, ...). The maximum is 199.
    100 => [
        'name' => totranslate('Variant option'),    
        'values' => [
                1 => [
                    'name' => totranslate('Disabled'),
                    'description' => totranslate('Colored wall face'),
                ],
                2 => [
                    'name' => totranslate('Enabled'), 
                    'description' => totranslate('Grayed wall face'),
                    'tmdisplay' => totranslate('Variant option (gray wall)'), 
                    'nobeginner' => true
                ]
            ],
        'default' => 1
    ],

    101 => [
        'name' => totranslate('Allow Undo/confirm'),    
        'values' => [
                1 => [
                    'name' => totranslate('Enabled'),
                ],
                2 => [
                    'name' => totranslate('Disabled'),
                ]
            ],
        'default' => 1
    ],

];



$game_preferences = [
    201 => [
        'name' => totranslate('Tile shimmer'),
        'needReload' => false,
        'values' => [
            1 => [ 'name' => totranslate('Enabled')],
            2 => [ 'name' => totranslate('Disabled')],
        ],
        'default' => 1
    ],

    202 => [
        'name' => totranslate('Dark background'),
        'needReload' => false,
        'values' => [
            1 => [ 'name' => totranslate('Disabled')],
            2 => [ 'name' => totranslate('Enabled')],
        ],
        'default' => 1
    ],

    203 => [
        'name' => totranslate('Add pattern for red tile (color-blind help)'),
        'needReload' => false,
        'values' => [
            1 => [ 'name' => totranslate('Enabled')],
            2 => [ 'name' => totranslate('Disabled')],
        ],
        'default' => 2
    ],
];


