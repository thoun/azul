
-- ------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- Azul implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here

-- Note: The database schema is created from this file when the game starts. If you modify this file,
--       you have to restart a game to see your changes in database.


--   `card_type` int(1) NOT NULL, -- 0 : FP, 1 : black, 2 : cyan, 3 : blue, 4 : yellow, 5 : red
--   `card_type_arg` int(1), -- unused
--   `card_location` varchar(20) NOT NULL, -- deck (bag), factory, hand, line${playerId}, wall${playerId}, discard
--   `card_location_arg` int(11), -- factory : 0 for center 1-9 for factories, line : 0 for floor line, 1-5, wall : yx line/column or x for floor line
CREATE TABLE IF NOT EXISTS `tile` (
   `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
   `card_type` int(1) NOT NULL,
   `card_type_arg` int(1),
   `card_location` varchar(20) NOT NULL,
   `card_location_arg` int(11),
   PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
