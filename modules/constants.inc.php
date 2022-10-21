<?php

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_FILL_FACTORIES', 10);

define('ST_PLAYER_CHOOSE_TILE', 20);

define('ST_PLAYER_CHOOSE_LINE', 30);
define('ST_PLAYER_CONFIRM_LINE', 31);

//define('ST_PLAYER_CHOOSE_COLUMN', 40);

define('ST_END_ROUND', 50);
define('ST_MULTIPLAYER_CHOOSE_COLUMNS', 51);
define('ST_PLACE_TILES', 52);    
define('ST_MULTIPLAYER_PRIVATE_CHOOSE_COLUMNS', 55);
define('ST_PRIVATE_CHOOSE_COLUMNS', 56);

define('ST_NEXT_PLAYER', 80);

define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Options
 */

define('VARIANT_OPTION', 'VariantOption');
define('UNDO', 'Undo');
define('FAST_SCORING', 'FastScoring');

/*
 * Variables
 */

define('FIRST_PLAYER_FOR_NEXT_TURN', 'FirstPlayerForNextTurn');
define('END_TURN_LOGGED', 'EndTurnLogged');

/*
 * Global variables
 */

define('UNDO_SELECT', 'UndoSelect');
define('UNDO_PLACE', 'UndoPlace');

?>
