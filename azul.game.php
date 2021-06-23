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
  * azul.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );

require_once('modules/constants.inc.php');
require_once('modules/tile.php');

function getIdPredicate($tile) {
    return $tile->id;
};

class Azul extends Table {
	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        self::initGameStateLabels([
            FIRST_PLAYER_FOR_NEXT_TURN => 10,
            VARIANT_OPTION => 100,
        ]);

        $this->tiles = self::getNew("module.common.deck");
        $this->tiles->init("tile");
        $this->tiles->autoreshuffle = true;      
	}
	
    protected function getGameName() {
		// Used for translations and stuff. Please do not modify.
        return "azul";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame($players, $options = []) {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = [];
        foreach ($players as $player_id => $player) {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."')";
        }
        $sql .= implode( $values, ',' );
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences($players, $gameinfos['player_colors']);
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        self::setGameStateInitialValue(FIRST_PLAYER_FOR_NEXT_TURN, intval(array_keys($players)[0]));
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        //self::initStat( 'table', 'table_teststat1', 0 );    // Init a table statistics
        //self::initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)

        $this->setupTiles();

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas() {
        $result = [];
    
        $current_player_id = self::getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo FROM player ";
        $result['players'] = self::getCollectionFromDb($sql);

        $result['factoryNumber'] = $this->getFactoryNumber(count($result['players']));

        $factories = [];
        $factoryNumber = $result['factoryNumber'];
        for ($factory=0; $factory<=$factoryNumber; $factory++) {
            $factories[$factory] = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
        }
        $result['factories'] = $factories;

        foreach($result['players'] as $playerId => &$player) {
            $player['lines'] = $this->getTilesFromDb($this->tiles->getCardsInLocation('line'.$playerId));
            $player['playerNo'] = intval($player['playerNo']);
        }
       
        // TODO set player tables
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
        $maxColumns = intval(self::getUniqueValueFromDB("SELECT MAX(MOD(card_location_arg, 100)) FROM tile WHERE `card_location` like 'wall%'"));
        return $maxColumns * 20;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    function isVariant() {
        return intval(self::getGameStateValue(VARIANT_OPTION)) === 2;
    }

    function getFactoryNumber($playerNumber = null) {
        if ($playerNumber == null) {
            $playerNumber = intval(self::getUniqueValueFromDB("SELECT count(*) FROM player "));
        }

        return $this->factoriesByPlayers[$playerNumber];
    }

    function getTileFromDb($dbTile) {
        if (!$dbTile || !array_key_exists('id', $dbTile)) {
            throw new Error('tile doesn\'t exists '.json_encode($dbTile));
        }
        return new Tile($dbTile);
    }

    function getTilesFromDb(array $dbTiles) {
        return array_map(function($dbTile) { return $this->getTileFromDb($dbTile); }, array_values($dbTiles));
    }

    function setupTiles() {
        $cards = [];
        $cards[] = [ 'type' => 0, 'type_arg' => null, 'nbr' => 1 ];
        for ($color=1; $color<=5; $color++) {
            $cards[] = [ 'type' => $color, 'type_arg' => null, 'nbr' => 20 ];
        }
        $this->tiles->createCards($cards, 'deck');
        $this->tiles->shuffle('deck');
    }

    function putFirstPlayerTile(array $firstPlayerTokens, int $playerId) {
        self::setGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN, $playerId);

        $this->placeTilesOnLine($playerId, $firstPlayerTokens, 0);
    }

    function placeTilesOnLine(int $playerId, array $tiles, int $line) {
        $currentTilesInLine = $this->getTilesFromLine($playerId, $line);
        $startIndex = count($currentTilesInLine);

        foreach ($tiles as $tile) {
            $tile->line = $line;
            $tile->column = ++$startIndex;
            $this->tiles->moveCard($tile->id, 'line'.$playerId, $line*100 + $tile->column);
        }

        $message = $tiles[0]->type == 0 ? '' : clienttranslate('TODO');

        self::notifyAllPlayers('tilesPlacedOnLine', $message, [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'number' => count($tiles),
            'color' => $this->getColor($tiles[0]->type),
            'tiles' => $tiles,
            'line' => $line,
        ]);
    }

    function getColor(int $type) {
        $colorName = null;
        switch ($type) {
            case 1: $colorName = _('Black'); break;
            case 2: $colorName = _('Cyan'); break;
            case 3: $colorName = _('Blue'); break;
            case 4: $colorName = _('Yellow'); break;
            case 5: $colorName = _('Red'); break;
        }
        return $colorName;
    }

    function multipleColumnsForLineWithColor($line, $type) {
        // TODO sometimes Yes with Variant
        return false;
    }

    function getTilesFromLine(int $playerId, int $line) {
        return array_values(array_filter(
            $this->getTilesFromDb($this->tiles->getCardsInLocation('line'.$playerId)), function($tile) use ($line) { return $tile->line == $line; })
        );
    }

    function availableLines(int $playerId) {

        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));
        $color = $tiles[0]->type;

        $lines = [0];
        for ($i=1; $i<=5; $i++) {
            $lineTiles = $this->getTilesFromLine($playerId, $i);
            if (count($lineTiles) == 0 || $lineTiles[0]->type == $color) {
                $lines[] = $i;
            }
        }

        return $lines;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in azul.action.php)
    */
    
    function takeTiles(int $id) {
        self::checkAction('takeTiles'); 
        
        $playerId = self::getActivePlayerId();

        $tile = $this->getTileFromDb($this->tiles->getCard($id));

        if ($tile->location !== 'factory') {
            throw new Error("Tile is not in a factory");
        }
        if ($tile->type === 0) {
            throw new Error("Tile is First Player token");
        }

        $factory = $tile->column;
        $factoryTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
        
        $selectedTiles = [];
        $discardedTiles = [];
        $hasFirstPlayer = false;

        if ($factory == 0) {
            $firstPlayerTokens = array_values(array_filter($factoryTiles, function ($fpTile) { return $fpTile->type == 0; }));
            $hasFirstPlayer = count($firstPlayerTokens) > 0;

            foreach($factoryTiles as $factoryTile) {
                if ($tile->type == $factoryTile->type) {
                    $selectedTiles[] = $factoryTile;
                }
            }

            $this->tiles->moveCards(array_map('getIdPredicate', $selectedTiles), 'hand', $playerId);

            if ($hasFirstPlayer) {
                $this->putFirstPlayerTile($firstPlayerTokens, $playerId);
            }
        } else {
            foreach($factoryTiles as $factoryTile) {
                if ($tile->type == $factoryTile->type) {
                    $selectedTiles[] = $factoryTile;
                } else {
                    $discardedTiles[] = $factoryTile;
                }
            }

            $this->tiles->moveCards(array_map('getIdPredicate', $selectedTiles), 'hand', $playerId);
            $this->tiles->moveCards(array_map('getIdPredicate', $discardedTiles), 'factory', 0);
        }

        $message = clienttranslate('${player_name} takes ${number} ${color}');
        if ($hasFirstPlayer) {
            $message .= ' ' . clienttranslate('and First Player tile');
        }

        self::notifyAllPlayers('tilesSelected', $message, [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'number' => count($selectedTiles),
            'color' => $this->getColor($tile->type),
            'selectedTiles' => $selectedTiles,
            'discardedTiles' => $discardedTiles,
        ]);

        $this->gamestate->nextState('placeTiles');
    }

    function selectLine(int $line) {
        self::checkAction('selectLine'); 
        
        $playerId = self::getActivePlayerId();

        if (array_search($line, $this->availableLines($playerId)) === false) {
            throw new Error('Line not available');
        }

        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));
        $this->placeTilesOnLine($playerId, $tiles, $line);

        if ($this->multipleColumnsForLineWithColor($line, $tiles[0]->type)) {
            $this->gamestate->nextState('chooseColumn');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function selectColumn($column) {
        self::checkAction('selectColumn'); 
        
        $playerId = self::getActivePlayerId();
        
        // TODO

        $this->gamestate->nextState('nextPlayer');
    }

    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argChooseLine() {
        $playerId = self::getActivePlayerId();
        
        return [
            'lines' => $this->availableLines($playerId),
        ];
    }

    function argChooseColumn() {
        // TODO

        return [
        ];
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stFillFactories() {
        $factories = [];

        $firstPlayerTile = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation(0, null, 'deck'))[0];
        $this->tiles->moveCard($firstPlayerTile->id, 'factory', 0);
        $factories[0] = [$firstPlayerTile];

        $factoryNumber = $this->getFactoryNumber();
        for ($factory=1; $factory<=$factoryNumber; $factory++) {
            $factories[$factory] = $this->getTilesFromDb($this->tiles->pickCardsForLocation(4, 'deck', 'factory', $factory));
        }

        self::notifyAllPlayers("factoriesFilled", clienttranslate("A new turn begins"), [
            'factories' => $factories,
        ]);

        $this->gamestate->nextState('next');
    }

    function stNextPlayer() {
        $factoriesAllEmpty = $this->tiles->countCardInLocation('factory') === 0;

        if ($factoriesAllEmpty) {
            $this->gamestate->nextState('endTurn');
        } else {
            $this->activeNextPlayer();
        
            $playerId = self::getActivePlayerId();
            self::giveExtraTime($playerId);

            $this->gamestate->nextState('nextPlayer');
        }
    }

    function stPlaceTiles() {
        // TODO

        if ($this->getGameProgression() === 30) {
            $this->gamestate->nextState('endGame');
        } else {
            $playerId = intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
            $this->gamestate->changeActivePlayer($playerId);
            self::giveExtraTime($playerId);

            $this->gamestate->nextState('next');
        }
    }
    

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn($state, $active_player) {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState("nextPlayer");
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, '' );
            
            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb($from_version) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
