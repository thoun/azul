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

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        self::DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = self::getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function isVariant() {
        return intval(self::getGameStateValue(VARIANT_OPTION)) === 2;
    }

    function allowUndo() {
        return intval(self::getGameStateValue(UNDO)) === 1;
    }

    function isFastScoring() {
        return intval(self::getGameStateValue(FAST_SCORING)) === 1;
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

    function getPlayerScore(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $incScore) {
        self::DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");
    }

    function decPlayerScore(int $playerId, int $decScore) {
        $newScore = max(0, $this->getPlayerScore($playerId) - $decScore);
        self::DbQuery("UPDATE player SET player_score = $newScore WHERE player_id = $playerId");
        return $newScore;
    }

    function incPlayerScoreAux(int $playerId, int $incScoreAux) {
        self::DbQuery("UPDATE player SET player_score_aux = player_score_aux + $incScoreAux WHERE player_id = $playerId");
    }

    function getSelectedColumns(int $playerId) {
        $json_obj = self::getUniqueValueFromDB("SELECT `selected_columns` FROM `player` where `player_id` = $playerId");
        $object = json_decode($json_obj, true);
        return $object;
    }

    function setSelectedColumn(int $playerId, int $line, int $column) {
        $object = $this->getSelectedColumns($playerId);
        $object[$line] = $column;
        
        $jsonObj = json_encode($object);        
        self::DbQuery("UPDATE player SET selected_columns = '$jsonObj' WHERE player_id = $playerId");
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
            'preserve' => [ 2 => 'type' ],
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
        if (count($tiles) === 0) {
            return [];
        }
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

    function notifPlaceLine(array $playersIds, int $line) {
        $completeLinesNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = $this->getTilesFromLine($playerId, $line);
            if (count($playerTiles) == $line) {
                
                $wallTile = $playerTiles[0];
                $column = null;
                if ($this->isVariant()) {
                    $selectedColumns = $this->getSelectedColumns($playerId);
                    $column = $selectedColumns[$line];
                } else {
                    $column = $this->getColumnForTile($line, $wallTile->type);
                }

                if ($column == 0) {
                    // variant : we place tiles on floor line, count will be done after
                    $this->placeTilesOnLine($playerId, $playerTiles, 0, false);
                } else {
                    $wallTile->column = $column;
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
            } else if (count($playerTiles) > 0) {
                self::incStat(1, 'incompleteLinesAtEndRound');
                self::incStat(1, 'incompleteLinesAtEndRound', $playerId);
            }
        }

        if (count($completeLinesNotif) > 0) {
            self::notifyAllPlayers('placeTileOnWall', '', [
                'completeLines' => $completeLinesNotif,
            ]);

            foreach ($completeLinesNotif as $playerId => $notif) {
                self::notifyAllPlayers('placeTileOnWallTextLogDetails', clienttranslate('${player_name} places ${number} ${color} and gains ${points} point(s)'), [
                    'player_name' => $this->getPlayerName($playerId),
                    'number' => 1,
                    'color' => $this->getColor($notif->placedTile->type),                
                    'type' => $notif->placedTile->type,
                    'preserve' => [ 2 => 'type' ],
                    'points' => $notif->pointsDetail->points,
                ]);
            }
        }
    }

    function notifPlaceLines(array $playersIds) {
        $fastScoring = $this->isFastScoring();

        if ($fastScoring) {
            for ($line = 1; $line <= 5; $line++) {
                $this->notifPlaceLine($playersIds, $line);
            }
            $this->notifFloorLine($playersIds, $line);
        } else {
            foreach($playersIds as $playerId) {
                for ($line = 1; $line <= 5; $line++) {
                    $this->notifPlaceLine([$playerId], $line);
                }
                $this->notifFloorLine([$playerId], $line);
            }
        }
    }

    function notifFloorLine(array $playersIds) {
        $floorLinesNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = $this->getTilesFromLine($playerId, 0);
            if (count($playerTiles) > 0) {                
                $this->tiles->moveCards(array_map('getIdPredicate', $playerTiles), 'discard');
                $points = 0;
                for ($i = 0; $i < min(7, count($playerTiles)); $i++) {
                    $points += $this->getPointsForFloorLine($i);
                }

                $obj = new stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = -$points;

                $floorLinesNotif[$playerId] = $obj;

                $this->decPlayerScore($playerId, $points);

                self::incStat($points, 'pointsLossFloorLine');
                self::incStat($points, 'pointsLossFloorLine', $playerId);
            } 
        }
        self::notifyAllPlayers('emptyFloorLine', '', [
            'floorLines' => $floorLinesNotif,
        ]);

        foreach ($floorLinesNotif as $playerId => $notif) {
            self::notifyAllPlayers('emptyFloorLineTextLogDetails', clienttranslate('${player_name} loses ${points} point(s) with Floor line'), [
                'player_name' => $this->getPlayerName($playerId),
                'points' => -$notif->points,
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

            foreach ($scoresNotif as $playerId => $notif) {
                self::notifyAllPlayers('completeLineLogDetails', clienttranslate('${player_name} gains ${points} point(s) with complete line ${line}'), [
                    'player_name' => $this->getPlayerName($playerId),
                    'line' => $notif->tiles[0]->line,
                    'points' => $notif->points,
                ]);
            }
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

            foreach ($scoresNotif as $playerId => $notif) {
                self::notifyAllPlayers('completeColumnLogDetails', clienttranslate('${player_name} gains ${points} point(s) with complete column ${column}'), [
                    'player_name' => $this->getPlayerName($playerId),
                    'column' => $notif->tiles[0]->column,
                    'points' => $notif->points,
                ]);
            }
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

            foreach ($scoresNotif as $playerId => $notif) {
                self::notifyAllPlayers('completeColorLogDetails', clienttranslate('${player_name} gains ${points} point(s) with complete color ${color}'), [
                    'player_name' => $this->getPlayerName($playerId),
                    'color' => $this->getColor($notif->tiles[0]->type),
                    'points' => $notif->points,
                ]);
            }
        }
    }

    function getAvailableColumnForColor(int $playerId, int $color, int $line) {
        $wall = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));

        $ghostTiles = $this->getSelectedColumnsArray($playerId);
        $wallAndGhost = array_merge($wall, $ghostTiles);

        $availableColumns = [];
        for ($column = 1; $column <= 5; $column++) {

            $tilesSameColorSameColumnOrSamePosition = array_values(array_filter(
                $wallAndGhost, function($tile) use ($column, $line, $color) { return $tile->column == $column && ($tile->type == $color || $tile->line == $line); })
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
            $playerWallTileLineCount = count(array_values(array_filter($playerWallTiles, function ($tile) use ($line) { return $tile->line == $line; })));
            
            // wall has only on spot left
            if ($playerWallTileLineCount >= 4) {
                return true;
            }
        }
        return false;
    }
}
