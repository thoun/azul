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
require_once('modules/debug-util.php');

function getIdPredicate($tile) {
    return $tile->id;
};

function sortByLine($a, $b) {
    if ($a->line == $b->line) {
        return 0;
    }
    return ($a->line < $b->line) ? -1 : 1;
}

function sortByColumn($a, $b) {
    if ($a->column == $b->column) {
        return 0;
    }
    return ($a->column < $b->column) ? -1 : 1;
}

class Azul extends Table {

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
            RESOLVING_LINE => 11,
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
        self::initStat('player', 'firstPlayer', 0);

        $this->setupTiles();

        // TODO TEMP to test
        //$this->debugSetup();

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
        $result['firstPlayerTokenPlayerId'] = intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
        $result['variant'] = $this->isVariant();

        $factories = [];
        $factoryNumber = $result['factoryNumber'];
        for ($factory=0; $factory<=$factoryNumber; $factory++) {
            $factories[$factory] = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
        }
        $result['factories'] = $factories;

        foreach($result['players'] as $playerId => &$player) {
            $player['lines'] = $this->getTilesFromDb($this->tiles->getCardsInLocation('line'.$playerId));
            $player['wall'] = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));
            $player['playerNo'] = intval($player['playerNo']);
            $player['hand'] = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));
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
                $playerWallTileLineCount = count(array_values(array_filter($playerWallTiles, function ($tile) use ($i) { return $tile->line == $i; })));
                if ($playerWallTileLineCount > $maxColumns) {
                    $maxColumns = $playerWallTileLineCount;
                }
            }
        }
        
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

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function incPlayerScore(int $playerId, int $incScore) {
        self::DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");
    }

    function incPlayerScoreAux(int $playerId, int $incScoreAux) {
        self::DbQuery("UPDATE player SET player_score_aux = player_score_aux + $incScoreAux WHERE player_id = $playerId");
    }

    function getSelectedColumn(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT selected_column FROM player WHERE player_id = $playerId"));
    }

    function setSelectedColumn(int $playerId, int $selectedColumn) {
        self::DbQuery("UPDATE player SET selected_column = $selectedColumn WHERE player_id = $playerId");
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

        $this->placeTilesOnLine($playerId, $firstPlayerTokens, 0, false);

        self::notifyAllPlayers('firstPlayerToken', clienttranslate('${player_name} took First Player tile and will start next round'), [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
        ]);
    }

    function placeTilesOnLine(int $playerId, array $tiles, int $line, bool $fromHand) {
        $startIndex = count($this->getTilesFromLine($playerId, $line));
        $startIndexFloorLine = count($this->getTilesFromLine($playerId, 0));

        $placedTiles = [];
        $discardedTiles = [];

        foreach ($tiles as $tile) {
            $aimColumn = ++$startIndex;
            if ($line == 0 || $aimColumn <= $line) {
                $tile->line = $line;
                $tile->column = $aimColumn;
                $placedTiles[] = $tile;
            } else {
                $tile->line = 0;
                $tile->column = ++$startIndexFloorLine;
                $discardedTiles[] = $tile;
            }

            $this->tiles->moveCard($tile->id, 'line'.$playerId, $tile->line * 100 + $tile->column);
        }

        $message = $tiles[0]->type == 0 ? '' : 
            ($line == 0 ?
                clienttranslate('${player_name} places ${number} ${color} on floor line') :
                clienttranslate('${player_name} places ${number} ${color} on line ${lineNumber}'));

        self::notifyAllPlayers('tilesPlacedOnLine', $message, [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'number' => count($tiles),
            'color' => $this->getColor($tiles[0]->type),            
            'type' => $tiles[0]->type,
            'line' => $line,
            'lineNumber' => $line,
            'placedTiles' => $placedTiles,
            'discardedTiles' => $discardedTiles,
            'fromHand' => $fromHand,
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

    function getTilesFromLine(int $playerId, int $line) {
        $tiles = array_values(array_filter(
            $this->getTilesFromDb($this->tiles->getCardsInLocation('line'.$playerId)), function($tile) use ($line) { return $tile->line == $line; })
        );
        usort($tiles, 'sortByColumn');

        return $tiles;
    }

    function someOfColor(array $tiles, int $type) {
        foreach ($tiles as $tile) {
            if ($tile->type == $type) {
                return true;
            }
        }
        return false;
    }

    function availableLines(int $playerId) {

        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));
        $color = $tiles[0]->type;

        $playerWallTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));

        $lines = [0];
        for ($i=1; $i<=5; $i++) {
            $lineTiles = $this->getTilesFromLine($playerId, $i);
            $playerWallTileLine = array_values(array_filter($playerWallTiles, function ($tile) use ($i) { return $tile->line == $i; }));
            $availableLine = count($lineTiles) == 0 || ($lineTiles[0]->type == $color && count($lineTiles) < $i);
            $availableWall = !$this->someOfColor($playerWallTileLine, $color);
            if ($availableLine && $availableWall) {
                $lines[] = $i;
            }
        }

        return $lines;
    }

    function getPlayersIds() {
        $sql = "SELECT player_id FROM player ORDER BY player_no";
        $dbResults = self::getCollectionFromDB($sql);
        return array_map(function($dbResult) { return intval($dbResult['player_id']); }, array_values($dbResults));
    }

    function getTileOnWallCoordinates(array $tiles, int $row, int $column) {
        foreach ($tiles as $tile) {
            if ($tile->line == $row && $tile->column == $column) {
                return $tile;
            }
        }
        return null;
    }

    function getPointsDetailForPlacedTile(int $playerId, object $tile) {
        $tilesOnWall = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));

        $rowTiles = [$tile];
        $columnTiles = [$tile];

        // tiles above
        for ($i = $tile->line - 1; $i >= 1; $i--) {
            $iTile = $this->getTileOnWallCoordinates($tilesOnWall, $i, $tile->column);
            if ($iTile != null) {
                $columnTiles[] = $iTile;
            } else {
                break;
            }
        }
        // tiles under
        for ($i = $tile->line + 1; $i <= 5; $i++) {
            $iTile = $this->getTileOnWallCoordinates($tilesOnWall, $i, $tile->column);
            if ($iTile != null) {
                $columnTiles[] = $iTile;
            } else {
                break;
            }
        }
        // tiles left
        for ($i = $tile->column - 1; $i >= 1; $i--) {
            $iTile = $this->getTileOnWallCoordinates($tilesOnWall, $tile->line, $i);
            if ($iTile != null) {
                $rowTiles[] = $iTile;
            } else {
                break;
            }
        }
        // tiles right
        for ($i = $tile->column + 1; $i <= 5; $i++) {
            $iTile = $this->getTileOnWallCoordinates($tilesOnWall, $tile->line, $i);
            if ($iTile != null) {
                $rowTiles[] = $iTile;
            } else {
                break;
            }
        }

        $result = new stdClass;
        $result->rowTiles = $rowTiles;
        $result->columnTiles = $columnTiles;

        $rowSize = count($rowTiles);
        $columnSize = count($columnTiles);

        if ($rowSize > 1 && $columnSize > 1) {
            $result->points = $columnSize + $rowSize;
        } else if ($columnSize > 1) {
            $result->points = $columnSize;
        } else if ($rowSize > 1) {
            $result->points = $rowSize;
        } else {
            $result->points = 1;
        }

        return $result;
    }
        
    function getPointsForFloorLine(int $tileNumber) {
        switch ($tileNumber) {
            case 0: return 0;
            case 1: case 2: return -1;
            case 3: case 4: case 5: return -2;
            default: return -3;
        }
    }

    function getColumnForTile(int $row, int $type) {
        return ($row + $this->indexForDefaultWall[$type] - 1) % 5 + 1;
    }

    function notifPlaceLine(array $playersIds, int $line) {
        $completeLinesNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = $this->getTilesFromLine($playerId, $line);
            if (count($playerTiles) == $line) {
                
                $wallTile = $playerTiles[0];
                $wallTile->column = $this->isVariant() ?
                    $this->getSelectedColumn($playerId) : 
                    $this->getColumnForTile($line, $wallTile->type);
                $discardedTiles = array_slice($playerTiles, 1);
                $this->tiles->moveCard($wallTile->id, 'wall'.$playerId, $line*100 + $wallTile->column);
                $this->tiles->moveCards(array_map('getIdPredicate', $discardedTiles), 'discard');

                $pointsDetail = $this->getPointsDetailForPlacedTile($playerId, $wallTile);

                $obj = new stdClass();
                $obj->placedTile = $wallTile;
                $obj->discardedTiles = $discardedTiles;
                $obj->pointsDetail = $pointsDetail;

                $completeLinesNotif[$playerId] = $obj;

                $this->incPlayerScore($playerId, $pointsDetail->points);

                self::incStat($pointsDetail->points, 'pointsWallTile');
                self::incStat($pointsDetail->points, 'pointsWallTile', $playerId);
            }
        }

        if (count($completeLinesNotif) > 0) {
            self::notifyAllPlayers('placeTileOnWall', '', [
                'completeLines' => $completeLinesNotif,
            ]);

        foreach ($completeLinesNotif as $playerId => $notif) {
            self::notifyAllPlayers('placeTileOnWallTextLogDetails', clienttranslate('${player_name} places ${number} ${color} and wins ${points} point'), [
                'player_name' => $this->getPlayerName($playerId),
                'number' => 1,
                'color' => $this->getColor($notif->placedTile->type),                
                'type' => $notif->placedTile->type,
                'points' => $notif->pointsDetail->points,
            ]);
        }
        }
    }

    function notifFloorLine(array $playersIds) {
        $floorLinesNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = $this->getTilesFromLine($playerId, 0);
            if (count($playerTiles) > 0) {                
                $this->tiles->moveCards(array_map('getIdPredicate', $playerTiles), 'discard');
                $points = $this->getPointsForFloorLine(count($playerTiles));

                $obj = new stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = $points;

                $floorLinesNotif[$playerId] = $obj;

                $this->incPlayerScore($playerId, $points);

                self::incStat(-$points, 'pointsLossFloorLine');
                self::incStat(-$points, 'pointsLossFloorLine', $playerId);
            } 
        }
        self::notifyAllPlayers('emptyFloorLine', '', [
            'floorLines' => $floorLinesNotif,
        ]);

        foreach ($floorLinesNotif as $playerId => $notif) {
            self::notifyAllPlayers('emptyFloorLineTextLogDetails', clienttranslate('${player_name} looses ${points} point with Floor line'), [
                'player_name' => $this->getPlayerName($playerId),
                'points' => abs($notif->points),
            ]);
        }
    }

    function notifCompleteLines(array $playersIds, array $walls, int $line) {        
        $scoresNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = array_values(array_filter($walls[$playerId], function($tile) use ($line) { return $tile->line == $line; }));
            usort($playerTiles, 'sortByColumn');

            if (count($playerTiles) == 5) {

                $obj = new stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = 2;

                $scoresNotif[$playerId] = $obj;

                $this->incPlayerScore($playerId, $obj->points);
                $this->incPlayerScoreAux($playerId, 1);

                self::incStat($obj->points, 'pointsCompleteLine');
                self::incStat($obj->points, 'pointsCompleteLine', $playerId);
            }
        }

        if (count($scoresNotif) > 0) {
            self::notifyAllPlayers('endScore', '', [
                'scores' => $scoresNotif,
            ]);
        }
    }

    function notifCompleteColumns(array $playersIds, array $walls, int $column) {                
        $scoresNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = array_values(array_filter($walls[$playerId], function($tile) use ($column) { return $tile->column == $column; }));
            usort($playerTiles, 'sortByLine');
            
            if (count($playerTiles) == 5) {

                $obj = new stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = 7;

                $scoresNotif[$playerId] = $obj;

                $this->incPlayerScore($playerId, $obj->points);

                self::incStat($obj->points, 'pointsCompleteColumn');
                self::incStat($obj->points, 'pointsCompleteColumn', $playerId);
            }
        }

        if (count($scoresNotif) > 0) {
            self::notifyAllPlayers('endScore', '', [
                'scores' => $scoresNotif,
            ]);
        }
    }

    function notifCompleteColors(array $playersIds, array $walls, int $color) {                
        $scoresNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = array_values(array_filter($walls[$playerId], function($tile) use ($color) { return $tile->type == $color; }));
            usort($playerTiles, 'sortByLine');
            
            if (count($playerTiles) == 5) {

                $obj = new stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = 10;

                $scoresNotif[$playerId] = $obj;

                $this->incPlayerScore($playerId, $obj->points);

                self::incStat($obj->points, 'pointsCompleteColor');
                self::incStat($obj->points, 'pointsCompleteColor', $playerId);
            }
        }

        if (count($scoresNotif) > 0) {
            self::notifyAllPlayers('endScore', '', [
                'scores' => $scoresNotif,
            ]);
        }
    }

    function getAvailableColumnForColor(int $playerId, int $color, int $line) {
        $wall = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));

        $availableColumns = [];
        for ($column = 1; $column <= 5; $column++) {

            $tilesSameColorSameColumnOrSamePosition = array_values(array_filter(
                $wall, function($tile) use ($column, $line, $color) { return $tile->column == $column && ($tile->type == $color || $tile->line == $line); })
            );

            if (count($tilesSameColorSameColumnOrSamePosition) == 0) {
                $availableColumns[] = $column;
            }
        }

        return $availableColumns;
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
        
        $playerId = intval(self::getActivePlayerId());

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

        
        if ($hasFirstPlayer) {
            $message = clienttranslate('${player_name} takes ${number} ${color} and First Player tile');
        } else {
            $message = clienttranslate('${player_name} takes ${number} ${color}');
        }

        self::notifyAllPlayers('tilesSelected', $message, [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'number' => count($selectedTiles),
            'color' => $this->getColor($tile->type),              
            'type' => $tile->type,
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
        $this->placeTilesOnLine($playerId, $tiles, $line, true);

        $this->gamestate->nextState('nextPlayer');
    }

    function selectColumn(int $column) {
        $playerId = self::getCurrentPlayerId();

        $this->setSelectedColumn($playerId, $column);

        if ($column == 0) {
            $line = intval(self::getGameStateValue(RESOLVING_LINE));
            $tiles = $this->getTilesFromLine($playerId, $line);
            $this->placeTilesOnLine($playerId, $tiles, 0, false);
        }
            
        // Make this player unactive now (and tell the machine state to use transtion "placeTiles" if all players are now unactive
        $this->gamestate->setPlayerNonMultiactive($playerId, 'placeTiles');
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
        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));

        return [
            'lines' => $this->availableLines($playerId),
            'number' => count($tiles),
            'color' => $this->getColor($tiles[0]->type),
            'type' => $tiles[0]->type,
        ];
    }

    function argChooseColumn() {
        $playersIds = $this->getPlayersIds();
        $line = intval(self::getGameStateValue(RESOLVING_LINE));

        $playersIdsWithCompleteLine = [];
        $playersIdsWithColor = [];

        foreach ($playersIds as $playerId) {
            $playerTiles = $this->getTilesFromLine($playerId, $line);
            if (count($playerTiles) == $line) {
                $columns = $this->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);
                $playersIdsWithCompleteLine[$playerId] = count($columns) > 0 ? $columns : [0];
                $playersIdsWithColor[$playerId] = $playerTiles[0]->type;
            }
        }

        return [
            'line' => $line,
            'columns' => $playersIdsWithCompleteLine,
            'colors' => $playersIdsWithColor,
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

        $firstPlayerTile = $this->getTilesFromDb($this->tiles->getCardsOfType(0, null))[0];
        $this->tiles->moveCard($firstPlayerTile->id, 'factory', 0);
        $factories[0] = [$firstPlayerTile];

        $factoryNumber = $this->getFactoryNumber();
        for ($factory=1; $factory<=$factoryNumber; $factory++) {
            $factories[$factory] = $this->getTilesFromDb($this->tiles->pickCardsForLocation(4, 'deck', 'factory', $factory));
        }

        self::notifyAllPlayers("factoriesFilled", clienttranslate("A new round begins !"), [
            'factories' => $factories,
        ]);

        self::incStat(1, 'roundsNumber');
        self::incStat(1, 'firstPlayer', intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN)));

        $this->gamestate->nextState('next');
    }

    function stNextPlayer() {
        $factoriesAllEmpty = $this->tiles->countCardInLocation('factory') == 0;
        $playerId = self::getActivePlayerId();

        self::incStat(1, 'turnsNumber');
        self::incStat(1, 'turnsNumber', $playerId);

        if ($factoriesAllEmpty) {
            $this->gamestate->nextState('endRound');
        } else {
            $this->activeNextPlayer();
        
            $playerId = self::getActivePlayerId();
            self::giveExtraTime($playerId);

            $this->gamestate->nextState('nextPlayer');
        }
    }

    function stEndRound() {
        self::setGameStateValue(RESOLVING_LINE, 1);

        if ($this->isVariant()) {
            $this->gamestate->nextState('chooseColumn');
        } else {
            $this->gamestate->nextState('placeTiles');
        }
    }

    function stChooseColumn() {
        $playersIds = $this->getPlayersIds();
        $line = intval(self::getGameStateValue(RESOLVING_LINE));

        $playersIdsWithCompleteLine = [];

        foreach ($playersIds as $playerId) {
            $playerTiles = $this->getTilesFromLine($playerId, $line);
            if (count($playerTiles) == $line) {
                $playersIdsWithCompleteLine[] = $playerId;
            }
        }

        if (count($playersIdsWithCompleteLine) > 0) {
            $this->gamestate->setPlayersMultiactive($playersIdsWithCompleteLine, 'placeTiles');
        } else {
            $this->gamestate->nextState('placeTiles');
        }
    }

    function stPlaceTiles() {
        $playersIds = $this->getPlayersIds();
        $line = intval(self::getGameStateValue(RESOLVING_LINE));

        if ($line > 0) {
            $this->notifPlaceLine($playersIds, $line);

            if ($line < 5) {
                $line++;
                self::setGameStateValue(RESOLVING_LINE, $line);                

                if ($this->isVariant()) {
                    $this->gamestate->nextState('chooseColumn');
                } else {
                    $this->gamestate->nextState('nextLine');
                }
            } else {
                self::setGameStateValue(RESOLVING_LINE, 0);
                $this->gamestate->nextState('nextLine');
            }
        } else {
            $this->notifFloorLine($playersIds);
        
            $firstPlayerTile = $this->getTilesFromDb($this->tiles->getCardsOfType(0))[0];
            $this->tiles->moveCard($firstPlayerTile->id, 'factory', 0);

            if ($this->getGameProgression() == 100) {
                $this->gamestate->nextState('endScore');
            } else {
                $playerId = intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
                $this->gamestate->changeActivePlayer($playerId);
                self::giveExtraTime($playerId);
    
                $this->gamestate->nextState('newRound');
            }
        }
    }

    function stEndScore() {
        $playersIds = $this->getPlayersIds();

        $walls = [];
        foreach ($playersIds as $playerId) {
            $walls[$playerId] = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));
        }

        // Gain 2 points for each complete horizontal line of 5 consecutive tiles on your wall.
        for ($line = 1; $line <= 5; $line++) {
            $this->notifCompleteLines($playersIds, $walls, $line);
        }
        // Gain 7 points for each complete vertical line of 5 consecutive tiles on your wall.
        for ($column = 1; $column <= 5; $column++) {
            $this->notifCompleteColumns($playersIds, $walls, $column);
        }
        // Gain 10 points for each color of which you have placed all 5 tiles on your wall.
        for ($color = 1; $color <= 5; $color++) {
            $this->notifCompleteColors($playersIds, $walls, $color);
        }

        //$this->gamestate->jumpToState(ST_FILL_FACTORIES);
        $this->gamestate->nextState('endGame');
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
