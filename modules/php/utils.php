<?php

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

trait UtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
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

    function isVariant() {
        return intval($this->getGameStateValue(VARIANT_OPTION)) === 2;
    }

    function isSpecialFactories() {
        return intval($this->getGameStateValue(SPECIAL_FACTORIES)) === 2;
    }

    function isUndoActivated(int $player) {
        return intval($this->getGameUserPreference($player, 101)) !== 2;
    }

    function isFastScoring() {
        return intval($this->getGameStateValue(FAST_SCORING)) === 1;
    }

    function getFactoryNumber($playerNumber = null) {
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
            throw new Error('tile doesn\'t exists '.json_encode($dbTile));
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

    function initSpecialFactories(int $playerCount) {
        $availableFactories = [];
        $availableSpecialFactories = [1,2,3,4,5,6,7,8,9];
        $factoryNumber = $this->getFactoryNumber($playerCount);
        for ($factory=1; $factory<=$factoryNumber; $factory++) {
            $availableFactories[] = $factory;
        }

        $specialFactories = [];

        for ($i = 0; $i < $playerCount; $i++) {
            $factoryIndex = bga_rand(0, count($availableFactories) - 1);
            $factoryNumber = array_splice($availableFactories, $factoryIndex, 1)[0];
            $specialFactoryIndex = bga_rand(0, count($availableSpecialFactories) - 1);
            $specialFactory = array_splice($availableSpecialFactories, $specialFactoryIndex, 1)[0];

            $specialFactories[$factoryNumber] = $specialFactory;
        }

        $this->setGlobalVariable(SPECIAL_FACTORIES, $specialFactories);

        $this->notifyAllPlayers('specialFactories', '', [
            'specialFactories' => $specialFactories,
        ]);
    }

    function getSpecialFactories() {
        return $this->getGlobalVariable(SPECIAL_FACTORIES, true);
    }

    function putFirstPlayerTile(array $firstPlayerTokens, int $playerId) {
        $this->setGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN, $playerId);

        $this->placeTilesOnLine($playerId, $firstPlayerTokens, 0, false);

        $this->notifyAllPlayers('firstPlayerToken', clienttranslate('${player_name} took First Player tile and will start next round'), [
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
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

        $this->notifyAllPlayers('tilesPlacedOnLine', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
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
        $tiles = array_values(array_filter(
            $this->getTilesFromDb($this->tiles->getCardsInLocation('line'.$playerId)), fn($tile) => $tile->line == $line)
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
        if (count($tiles) === 0) {
            return [];
        }
        $color = $tiles[0]->type;

        $playerWallTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));

        $lines = [0];
        for ($i=1; $i<=5; $i++) {
            $lineTiles = $this->getTilesFromLine($playerId, $i);
            $playerWallTileLine = array_values(array_filter($playerWallTiles, fn($tile) => $tile->line == $i));
            $availableLine = count($lineTiles) == 0 || ($lineTiles[0]->type == $color && count($lineTiles) < $i);
            $availableWall = !$this->someOfColor($playerWallTileLine, $color);
            if ($availableLine && $availableWall) {
                $lines[] = $i;
            }
        }

        return $lines;
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
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
        
    function getPointsForFloorLine(int $tileIndex) {
        switch ($tileIndex) {
            case 0: case 1: return 1;
            case 2: case 3: case 4: return 2;
            default: return 3;
        }
    }

    function getColumnForTile(int $row, int $type) {
        return ($row + $this->indexForDefaultWall[$type] - 1) % 5 + 1;
    }

    function getAvailableColumnForColor(int $playerId, int $color, int $line) {
        $wall = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));

        $ghostTiles = $this->getSelectedColumnsArray($playerId);
        $wallAndGhost = array_merge($wall, $ghostTiles);

        $availableColumns = [];
        for ($column = 1; $column <= 5; $column++) {

            $tilesSameColorSameColumnOrSamePosition = array_values(array_filter(
                $wallAndGhost, fn($tile) => $tile->column == $column && ($tile->type == $color || $tile->line == $line))
            );

            if (count($tilesSameColorSameColumnOrSamePosition) == 0) {
                $availableColumns[] = $column;
            }
        }

        return count($availableColumns) > 0 ? $availableColumns : [0];
    }

    function lineWillBeComplete(int $playerId, int $line) {
        if (count($this->getTilesFromLine($playerId, $line)) == $line) {
            // construction line is complete
            
            $playerWallTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));
            $playerWallTileLineCount = count(array_values(array_filter($playerWallTiles, fn($tile) => $tile->line == $line)));
            
            // wall has only on spot left
            if ($playerWallTileLineCount >= 4) {
                return true;
            }
        }
        return false;
    }
}
