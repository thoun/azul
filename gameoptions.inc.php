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
        'default' => 1,
        'level' => 'major',
    ],

    /*110 => [
        'name' => totranslate('Special Factories (Azul Master Chocolatier variant)'),    
        'values' => [
                1 => [
                    'name' => totranslate('Disabled'),
                ],
                2 => [
                    'name' => totranslate('Enabled'), 
                    'description' => totranslate('Random special factories are placed in the game'),
                    'tmdisplay' => totranslate('Special Factories'), 
                    'nobeginner' => true,
                    'alpha' => true,
                ]
            ],
        'default' => 1,
    ],*/

    101 => [
        'name' => totranslate('Allow Undo/confirm'),    
        'values' => [
                1 => [
                    'name' => totranslate('Enabled'),
                ],
                2 => [
                    'name' => totranslate('Disabled'),
                    'tmdisplay' => totranslate('Undo/confirm disabled'), 
                ]
            ],
        'default' => 1
    ],

    102 => [
        'name' => totranslate('Fast scoring'),    
        'values' => [
                1 => [
                    'name' => totranslate('Enabled'),
                    'tmdisplay' => totranslate('Fast scoring'), 
                ],
                2 => [
                    'name' => totranslate('Disabled'),
                ]
            ],
        'default' => 2
    ],

];



$game_preferences = [

    210 => [
        'name' => totranslate('Azul Master Chocolatier skin'),
        'needReload' => false,
        'values' => [
            1 => [ 'name' => totranslate('Enabled')],
            2 => [ 'name' => totranslate('Disabled')],
        ],
        'default' => 2
    ],

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

    204 => [
        'name' => totranslate('Countdown timer for confirm button'),
        'needReload' => false,
        'values' => [
            1 => ['name' => totranslate('Enabled')],
            2 => ['name' => totranslate('Disabled')],
        ],
        'default' => 1
    ],

    205 => [
        'name' => totranslate('Display tile count in factory center'),
        'needReload' => false,
        'values' => [
            1 => ['name' => totranslate('Enabled')],
            2 => ['name' => totranslate('Disabled')],
        ],
        'default' => 1
    ],

    206 => [
        'name' => totranslate('Font style for player names'),
        'needReload' => false,
        'values' => [
            1 => [ 'name' => totranslate( 'Default font' )],
            2 => [ 'name' => totranslate( 'Azul font' )],
        ],
        'default' => 2
    ],

    // 210 chocolatier

    299 => [
        'name' => '',
        'needReload' => false,
        'values' => [
            1 => ['name' => totranslate('Enabled')],
            2 => ['name' => totranslate('Disabled')],
        ],
        'default' => 1
    ],
];


