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
];
