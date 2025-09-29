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
declare(strict_types=1);

namespace Bga\Games\Azul;

use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\Azul\Boards\Board;
use Bga\Games\Azul\States\ChooseTile;
use Tile;

require_once('framework-prototype/Helpers/Arrays.php');

require_once('constants.inc.php');
require_once('tile.php');
require_once('undo.php');

class Game extends \Bga\GameFramework\Table {

    use DebugUtilTrait;

    public \Bga\GameFramework\Components\Deck $tiles;
    public Board $board;
    public array $factoriesByPlayers;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels([
            FIRST_PLAYER_FOR_NEXT_TURN => 10,
            END_TURN_LOGGED => 12,
            SPECIAL_FACTORY_ZERO_OWNER => 20,
        ]);


        $this->factoriesByPlayers = [
            2 => 5,
            3 => 7,
            4 => 9,
        ];

        $this->tiles = $this->getNew("module.common.deck");
        $this->tiles->init("tile");
        $this->tiles->autoreshuffle = true;      
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
        $gameinfos = $this->getGameinfos();
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
        $this->DbQuery( $sql );
        $this->reattributeColorsBasedOnPreferences($players, $gameinfos['player_colors']);
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue(FIRST_PLAYER_FOR_NEXT_TURN, intval(array_keys($players)[0]));
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        $this->initStat('table', 'roundsNumber', 0);
        $this->initStat('table', 'turnsNumber', 0);
        $this->initStat('player', 'turnsNumber', 0);
        $this->initStat('table', 'pointsWallTile', 0);
        $this->initStat('player', 'pointsWallTile', 0);
        $this->initStat('table', 'pointsLossFloorLine', 0);
        $this->initStat('player', 'pointsLossFloorLine', 0);
        $this->initStat('table', 'pointsCompleteLine', 0);
        $this->initStat('player', 'pointsCompleteLine', 0);
        $this->initStat('table', 'pointsCompleteColumn', 0);
        $this->initStat('player', 'pointsCompleteColumn', 0);
        $this->initStat('table', 'pointsCompleteColor', 0);
        $this->initStat('player', 'pointsCompleteColor', 0);
        $this->initStat('table', 'incompleteLinesAtEndRound', 0);
        $this->initStat('player', 'incompleteLinesAtEndRound', 0);
        $this->initStat('player', 'firstPlayer', 0);

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
    protected function getAllDatas(): array {
        $result = [];
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo FROM player ";
        $result['players'] = $this->getCollectionFromDb($sql);

        $result['factoryNumber'] = $this->getFactoryNumber(count($result['players']));
        $result['firstPlayerTokenPlayerId'] = intval($this->getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
        $board = $this->getBoard();
        $result['boardNumber'] = $this->getBoardNumber();
        $result['boardSetPoints'] = $board->getSetPoints();

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

            if ($board->getFixedColors() !== null) {
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
                $playerWallTileLineCount = Arrays::count($playerWallTiles, fn($tile) => $tile->line == $i);
                if ($playerWallTileLineCount > $maxColumns) {
                    $maxColumns = $playerWallTileLineCount;
                }
            }
        }
        
        return $maxColumns * 20;
    }

    function actUndoTakeTiles(int $activePlayerId) { 
        $undoFactory = $this->getGlobalVariable(UNDO_FACTORY);
        if ($undoFactory != null) {
            $otherFactories = [];
            foreach($undoFactory->tiles as $tile) {
                $currentFactory = $this->getTileFromDb($this->tiles->getCard($tile->id))->column;
                if ($currentFactory != $undoFactory->from && !in_array($currentFactory, $otherFactories)) {
                    $otherFactories[] = $currentFactory;
                }
            }

            $this->tiles->moveCards(array_map(fn($t) => $t->id, $undoFactory->tiles), 'factory', $undoFactory->from);

            $partialFactories = [
                $undoFactory->from => $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $undoFactory->from)),
            ];
    
            $this->notify->all("factoriesChanged", '', [
                'factory' => $undoFactory->from,
                'factories' => $partialFactories,
                'tiles' => $undoFactory->tiles,
            ]);
            foreach($otherFactories as $otherFactory) {
                $partialFactories = [
                    $otherFactory => $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $otherFactory)),
                ];    
                $this->notify->all("factoriesChanged", '', [
                    'factory' => $otherFactory,
                    'factories' => $partialFactories,
                    'tiles' => [],
                ]);
            }
        }

        $undo = $this->getGlobalVariable(UNDO_SELECT);

        if (property_exists($undo, 'takeFromSpecialFactoryZero') && $undo->takeFromSpecialFactoryZero) {
            $this->setGameStateValue(SPECIAL_FACTORY_ZERO_OWNER, 0);
            $this->notify->all('moveSpecialFactoryZero', '', [
                'playerId' => 0,
            ]);
        }

        $factoryTilesBefore = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $undo->from));
        $this->tiles->moveCards(array_map(fn($t) => $t->id, $undo->tiles), 'factory', $undo->from);
        $this->setGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN, $undo->previousFirstPlayer);

        $this->notify->all('undoTakeTiles', clienttranslate('${player_name} cancels tile selection'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->getPlayerNameById($activePlayerId),
            'undo' => $undo,
            'factoryTilesBefore' => $factoryTilesBefore,
            'repositionTiles' => $undoFactory != null,
        ]);

        return ChooseTile::class;
    }

    function actUndoColumns(int $currentPlayerId) {
        $this->DbQuery("UPDATE player SET selected_columns = '[]' WHERE player_id = $currentPlayerId");
        
        $this->notify->player($currentPlayerId, 'updateSelectColumn', '', [
            'playerId' => $currentPlayerId,
            'arg' => $this->argChooseColumnForPlayer($currentPlayerId),
            'undo' => true,
        ]);

        $this->gamestate->nextPrivateState($currentPlayerId, 'undo');
    }

    function nextColumnToSelect(int $playerId) {
        $selectedColumns = $this->getSelectedColumns($playerId);

        for ($line = 1; $line <= 5; $line++) {
            if (!array_key_exists($line, $selectedColumns)) {
                $playerTiles = $this->getTilesFromLine($playerId, $line);
                if (count($playerTiles) == $line) {
                    $availableColumns = $this->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);

                    if (count($availableColumns) > 1) {
                        $lineInfos = new \stdClass();
                        $lineInfos->color = $playerTiles[0]->type;
                        $lineInfos->availableColumns = $availableColumns;
                        $lineInfos->line = $line;
                        return $lineInfos;
                    } else {
                        // if only one possibility, it's automaticaly selected
                        $this->setSelectedColumn($playerId, $line, $availableColumns[0]);
                    }
                }
            }
        }
        return null;
    }

    function getSelectedColumnsArray(int $playerId) {
        $result = [];
        $selectedColumns = $this->getSelectedColumns($playerId);
        foreach($selectedColumns as $line => $column) {
            $selectedColumn = new \stdClass();
            $selectedColumn->line = $line;
            $selectedColumn->column = $column;
            $tiles = $this->getTilesFromLine($playerId, $line);
            if (count($tiles) > 0) {
                $selectedColumn->type = $tiles[0]->type;
                $selectedColumn->color = $selectedColumn->type;
            }
            $result[] = $selectedColumn;
        }

        return $result;
    }

    function argChooseColumnForPlayer(int $playerId) {
        $playerArg = new \stdClass();
        $playerArg->nextColumnToSelect = $this->nextColumnToSelect($playerId);
        $playerArg->selectedColumns = $this->getSelectedColumnsArray($playerId);

        return $playerArg;
    }

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function getBoardNumber(): int {
        return $this->tableOptions->get(100);
    }

    function getBoard(): Board {
        if (!isset($this->board)) {
            $boardNumber = $this->getBoardNumber();
            $className = "Bga\Games\Azul\Boards\Board{$boardNumber}";
            $this->board = new $className;
        }
        return $this->board;
    }

    function isSpecialFactories(): bool {
        return $this->tableOptions->get(110) === 2;
    }

    function isUndoActivated(int $player): bool {
        return $this->userPreferences->get($player, 101) !== 2;
    }

    function isFastScoring(): bool {
        return $this->tableOptions->get(102) === 1;
    }

    function getFactoryNumber($playerNumber = null): int {
        if ($playerNumber == null) {
            $playerNumber = intval($this->getUniqueValueFromDB("SELECT count(*) FROM player "));
        }

        return $this->factoriesByPlayers[$playerNumber];
    }

    function getPlayerScore(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $incScore) {
        $this->DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");
    }

    function decPlayerScore(int $playerId, int $decScore) {
        $newScore = max(0, $this->getPlayerScore($playerId) - $decScore);
        $this->DbQuery("UPDATE player SET player_score = $newScore WHERE player_id = $playerId");
        return $newScore;
    }

    function incPlayerScoreAux(int $playerId, int $incScoreAux) {
        $this->DbQuery("UPDATE player SET player_score_aux = player_score_aux + $incScoreAux WHERE player_id = $playerId");
    }

    function getSelectedColumns(int $playerId) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `selected_columns` FROM `player` where `player_id` = $playerId");
        $object = json_decode($json_obj, true);
        return $object ?? [];
    }

    function setSelectedColumn(int $playerId, int $line, int $column) {
        $object = $this->getSelectedColumns($playerId);
        $object[$line] = $column;
        
        $jsonObj = json_encode($object);        
        $this->DbQuery("UPDATE player SET selected_columns = '$jsonObj' WHERE player_id = $playerId");
    }

    function getTileFromDb($dbTile) {
        if (!$dbTile || !array_key_exists('id', $dbTile)) {
            throw new \Error('tile doesn\'t exists '.json_encode($dbTile));
        }
        return new Tile($dbTile);
    }

    function getTilesFromDb(array $dbTiles) {
        return array_map(fn($dbTile) => $this->getTileFromDb($dbTile), array_values($dbTiles));
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

    function getSpecialFactories() {
        return $this->getGlobalVariable(SPECIAL_FACTORIES, true);
    }

    function putFirstPlayerTile(array $firstPlayerTokens, int $playerId) {
        $this->setGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN, $playerId);

        $this->placeTilesOnLine($playerId, $firstPlayerTokens, 0, false);

        $this->notify->all('firstPlayerToken', clienttranslate('${player_name} took First Player tile and will start next round'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
        ]);
    }

    function placeTilesOnLine(int $playerId, array $tiles, int $line, bool $fromHand) {
        $startIndex = count($this->getTilesFromLine($playerId, $line));
        $startIndexFloorLine = count($this->getTilesFromLine($playerId, 0));

        $canPlaceOnSpecialFactoryZero = intval($this->getGameStateValue(SPECIAL_FACTORY_ZERO_OWNER)) == $playerId && count($this->getTilesFromLine($playerId, -1)) == 0;

        $placedTiles = [];
        $discardedTiles = [];
        $discardedTilesToSpecialFactoryZero = [];

        foreach ($tiles as $tile) {
            $aimColumn = ++$startIndex;
            if ($line > 0 && $aimColumn <= $line) {
                $tile->line = $line;
                $tile->column = $aimColumn;
                $placedTiles[] = $tile;
            } else if ($canPlaceOnSpecialFactoryZero) {
                $tile->line = -1;
                $tile->column = 0;
                $discardedTilesToSpecialFactoryZero[] = $tile;
                $canPlaceOnSpecialFactoryZero = 0;
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

        $this->notify->all('tilesPlacedOnLine', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'number' => count($tiles),
            'color' => $this->getColor($tiles[0]->type),
            'i18n' => ['color'],
            'type' => $tiles[0]->type,
            'preserve' => [ 2 => 'type' ],
            'line' => $line,
            'lineNumber' => $line,
            'placedTiles' => $placedTiles,
            'discardedTiles' => $discardedTiles,
            'discardedTilesToSpecialFactoryZero' => $discardedTilesToSpecialFactoryZero,
            'fromHand' => $fromHand,
        ]);
    }

    function getColor(int $type) {
        $colorName = null;
        switch ($type) {
            case 1: $colorName = clienttranslate('Black'); break;
            case 2: $colorName = clienttranslate('Cyan'); break;
            case 3: $colorName = clienttranslate('Blue'); break;
            case 4: $colorName = clienttranslate('Yellow'); break;
            case 5: $colorName = clienttranslate('Red'); break;
        }
        return $colorName;
    }

    function getTilesFromLine(int $playerId, int $line) {
        $tiles = Arrays::filter(
            $this->getTilesFromDb($this->tiles->getCardsInLocation('line'.$playerId)), fn($tile) => $tile->line == $line
        );
        usort($tiles, fn($a, $b) => $this->sortByColumn($a, $b));

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

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getAvailableColumnForColor(int $playerId, int $color, int $line) {
        $fixedColors = $this->getBoard()->getFixedColors();
        $fixedTilesForLine = $fixedColors[$line] ?? [];
        $wall = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));

        $ghostTiles = $this->getSelectedColumnsArray($playerId);
        $wallAndGhost = array_merge($wall, $ghostTiles);

        $availableColumns = [];
        for ($column = 1; $column <= 5; $column++) {
            $fixedColor = $fixedTilesForLine[$column] ?? null;

            $tilesSameColorSameColumnOrSamePosition = Arrays::filter(
                $wallAndGhost, fn($tile) => $tile->column == $column && ($tile->type == $color || $tile->line == $line)
            );
            $validColor = $fixedColor === null || $fixedColor['color'] === $color;

            if ($validColor && count($tilesSameColorSameColumnOrSamePosition) == 0) {
                $availableColumns[] = $column;
            }
        }

        return count($availableColumns) > 0 ? $availableColumns : [0];
    }

    function lineWillBeComplete(int $playerId, int $line) {
        if (count($this->getTilesFromLine($playerId, $line)) == $line) {
            // construction line is complete
            
            $playerWallTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));
            $playerWallTileLineCount = Arrays::count($playerWallTiles, fn($tile) => $tile->line == $line);
            
            // wall has only on spot left
            if ($playerWallTileLineCount >= 4) {
                return true;
            }
        }
        return false;
    }

    function sortByColumn($a, $b) {
        if ($a->column == $b->column) {
            return 0;
        }
        return ($a->column < $b->column) ? -1 : 1;
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

        function zombieTurn_chooseLineAnswerPoints(int $tileColor, int $tileCount, array $playerLines, array $playerWallTiles): array {
            /*
            Not real points, but considered effectiveness.
            Number of played tiles for the row, or -9999 if unplayable. x2 if completing an already started row. -0.4 for each discarded tile.
            */
            $possibleAnswerPoints = [
                0 => 0,
            ];

            for ($line=1; $line<=5; $line++) {
                $tilesOfLine = Arrays::filter($playerLines, fn($tile) => $tile->line == $line);
                if (count($tilesOfLine) > 0) {
                    $lineColor = $tilesOfLine[0]->type;
                    if (count($tilesOfLine) < $line && $tileColor == $lineColor) {
                        $possibleAnswerPoints[$line] = $tileCount * 2;
                        $discarded = $tileCount - ($line - count($tilesOfLine));
                        if ($discarded > 0) {
                            $possibleAnswerPoints[$line] -= $discarded * 0.4;
                        }
                    } else {
                        $possibleAnswerPoints[$line] = -9999;
                    }
                } else {
                    $playerWallTileLine = Arrays::filter($playerWallTiles, fn($tile) => $tile->line == $line);

                    if ($this->someOfColor($playerWallTileLine, $tileColor)) {
                        $possibleAnswerPoints[$line] = -9999;
                    } else {
                        $possibleAnswerPoints[$line] = $tileCount;
                        $discarded = $tileCount - $line;
                        if ($discarded > 0) {
                            $possibleAnswerPoints[$line] -= $discarded * 0.4;
                        }
                    }
                }
            }

            return $possibleAnswerPoints;
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
            
            /*if ($from_version <= 2109161337) {
                // ! important ! Use DBPREFIX_<table_name> for all tables    
                $sql = "CREATE TABLE IF NOT EXISTS DBPREFIX_global_variables(`name` varchar(50) NOT NULL, `value` json, PRIMARY KEY (`name`)) ENGINE=InnoDB DEFAULT CHARSET=utf8";
                $this->applyDbUpgradeToAllDB($sql);
            }

            if ($from_version <= 2109241936) {
                // ! important ! Use <table_name> for all tables    
                $sql = "ALTER TABLE DBPREFIX_player ADD `selected_columns` json";
                $this->applyDbUpgradeToAllDB($sql);
            }*/
        }    
}
