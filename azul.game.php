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
require_once('modules/undo.php');
require_once('modules/utils.php');
require_once('modules/actions.php');
require_once('modules/args.php');
require_once('modules/states.php');
require_once('modules/debug-util.php');

class Azul extends Table {

    use UtilTrait;
    use ActionTrait;
    use ArgsTrait;
    use StateTrait;
    use DebugUtilTrait;

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
            END_TURN_LOGGED => 12,
            SPECIAL_FACTORY_ZERO_OWNER => 20,

            VARIANT_OPTION => 100,
            UNDO => 101,
            FAST_SCORING => 102,
            SPECIAL_FACTORIES => 110,
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
        $sql .= implode(',', $values);
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences($players, $gameinfos['player_colors']);
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        self::setGameStateInitialValue(FIRST_PLAYER_FOR_NEXT_TURN, intval(array_keys($players)[0]));
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        self::initStat('table', 'roundsNumber', 0);
        self::initStat('table', 'turnsNumber', 0);
        self::initStat('player', 'turnsNumber', 0);
        self::initStat('table', 'pointsWallTile', 0);
        self::initStat('player', 'pointsWallTile', 0);
        self::initStat('table', 'pointsLossFloorLine', 0);
        self::initStat('player', 'pointsLossFloorLine', 0);
        self::initStat('table', 'pointsCompleteLine', 0);
        self::initStat('player', 'pointsCompleteLine', 0);
        self::initStat('table', 'pointsCompleteColumn', 0);
        self::initStat('player', 'pointsCompleteColumn', 0);
        self::initStat('table', 'pointsCompleteColor', 0);
        self::initStat('player', 'pointsCompleteColor', 0);
        self::initStat('table', 'incompleteLinesAtEndRound', 0);
        self::initStat('player', 'incompleteLinesAtEndRound', 0);
        self::initStat('player', 'firstPlayer', 0);

        $this->setupTiles();

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        // TODO TEMP to test
        //$this->debugSetup();

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
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo FROM player ";
        $result['players'] = self::getCollectionFromDb($sql);

        $result['factoryNumber'] = $this->getFactoryNumber(count($result['players']));
        $result['firstPlayerTokenPlayerId'] = intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
        $isVariant = $this->isVariant();
        $result['variant'] = $isVariant;

        $factories = [];
        $factoryNumber = $result['factoryNumber'];
        for ($factory=0; $factory<=$factoryNumber; $factory++) {
            $factories[$factory] = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
        }
        $result['factories'] = $factories;

        $endRound = false;
        foreach($result['players'] as $playerId => &$player) {
            $player['lines'] = $this->getTilesFromDb($this->tiles->getCardsInLocation('line'.$playerId));
            $player['wall'] = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));
            $player['playerNo'] = intval($player['playerNo']);
            $player['hand'] = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));

            for ($line=1; $line<=5; $line++) {
                if ($this->lineWillBeComplete($playerId, $line)) {
                    $endRound = true;
                }
            }

            if ($isVariant) {
                $player['selectedColumns'] = $this->getSelectedColumnsArray($playerId);
            }
        }

        $result['endRound'] = $endRound;
        $result['fastScoring'] = $this->isFastScoring();
        $result['remainingTiles'] = intval($this->tiles->countCardInLocation('deck'));

        if ($this->isSpecialFactories()) {
            $result['specialFactoryZeroOwner'] = intval($this->getGameStateValue(SPECIAL_FACTORY_ZERO_OWNER));
            $result['specialFactories'] = $this->getSpecialFactories();
        }
  
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
        $maxColumns = 0;
        
        $playerIds = $this->getPlayersIds();
        foreach ($playerIds as $playerId) {
            $playerWallTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));
            for ($i=1; $i<=5; $i++) {
                $playerWallTileLineCount = count(array_values(array_filter($playerWallTiles, fn($tile) => $tile->line == $i)));
                if ($playerWallTileLineCount > $maxColumns) {
                    $maxColumns = $playerWallTileLineCount;
                }
            }
        }
        
        return $maxColumns * 20;
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
                    case 'chooseTile':
                        $factoryTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory'));
                        $tiles = array_values(array_filter($factoryTiles, fn($tile) => $tile->type > 0));
                        $this->takeTiles($tiles[bga_rand(1, count($tiles)) - 1]->id, true);
                        break;
                    case 'chooseLine':
                        $this->selectLine(0, true);
                        break;
                    case 'confirmLine':
                        $this->confirmLine(true);
                        break;
                    default:
                        $this->gamestate->nextState("nextPlayer"); // all player actions got nextPlayer action as a "zombiePass"
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
            
            if ($from_version <= 2109161337) {
                // ! important ! Use DBPREFIX_<table_name> for all tables    
                $sql = "CREATE TABLE IF NOT EXISTS DBPREFIX_global_variables(`name` varchar(50) NOT NULL, `value` json, PRIMARY KEY (`name`)) ENGINE=InnoDB DEFAULT CHARSET=utf8";
                self::applyDbUpgradeToAllDB($sql);
            }

            if ($from_version <= 2109241936) {
                // ! important ! Use <table_name> for all tables    
                $sql = "ALTER TABLE DBPREFIX_player ADD `selected_columns` json";
                self::applyDbUpgradeToAllDB($sql);
            }
        }    
}
