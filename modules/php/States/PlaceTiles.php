<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\StateType;
use Bga\Games\Azul\Boards\Board;
use Bga\Games\Azul\Game;

class PlaceTiles extends \Bga\GameFramework\States\GameState
{

    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_PLACE_TILES, 
            type: StateType::GAME,
        );
    }

    function onEnteringState() {
        $board = $this->game->getBoard();
        $playersIds = $this->game->getPlayersIds();

        $this->notifPlaceLines($playersIds, $board);
    
        $firstPlayerTile = $this->game->getTilesFromDb($this->game->tiles->getCardsOfType(0))[0];
        $this->game->tiles->moveCard($firstPlayerTile->id, 'factory', 0);

        if (intval($this->game->getGameStateValue(SPECIAL_FACTORY_ZERO_OWNER)) > 0) {
            $this->game->setGameStateValue(SPECIAL_FACTORY_ZERO_OWNER, 0);
            $this->notify->all('moveSpecialFactoryZero', '', [
                'playerId' => 0,
            ]);
        }

        if ($this->game->getGameProgression() == 100) {
            return EndScore::class;
        } else {
            $playerId = intval($this->game->getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
            $this->gamestate->changeActivePlayer($playerId);
            $this->game->giveExtraTime($playerId);

            return FillFactories::class;
        }
    }

    function notifPlaceLines(array $playersIds, Board $board) {
        $fastScoring = $this->game->isFastScoring();

        if ($fastScoring) {
            for ($line = 1; $line <= 5; $line++) {
                $this->notifPlaceLine($playersIds, $line, $board);
            }
            $this->notifFloorLine($playersIds, $line);
        } else {
            foreach($playersIds as $playerId) {
                for ($line = 1; $line <= 5; $line++) {
                    $this->notifPlaceLine([$playerId], $line, $board);
                }
                $this->notifFloorLine([$playerId], $line);
            }
        }
    }

    function notifPlaceLine(array $playersIds, int $line, Board $board) {
        $completeLinesNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = $this->game->getTilesFromLine($playerId, $line);
            if (count($playerTiles) == $line) {
                
                $wallTile = $playerTiles[0];
                $column = null;
                if ($board->getFixedColors() !== null) {
                    $selectedColumns = $this->game->getSelectedColumns($playerId);
                    if (!array_key_exists($line, $selectedColumns)) {
                        // happens when a player left the game with a complete row
                        $column = 0;
                    } else {
                        $column = $selectedColumns[$line];
                    }
                } else {
                    $column = $this->getColumnForTile($line, $wallTile->type);
                }

                if ($column == 0) {
                    // variant : we place tiles on floor line, count will be done after
                    $this->game->placeTilesOnLine($playerId, $playerTiles, 0, false);
                } else {
                    $wallTile->column = $column;
                    $discardedTiles = array_slice($playerTiles, 1);
                    $this->game->tiles->moveCard($wallTile->id, 'wall'.$playerId, $line*100 + $wallTile->column);
                    $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $discardedTiles), 'discard');
    
                    $pointsDetail = $this->getPointsDetailForPlacedTile($playerId, $wallTile);
    
                    $obj = new \stdClass();
                    $obj->placedTile = $wallTile;
                    $obj->discardedTiles = $discardedTiles;
                    $obj->pointsDetail = $pointsDetail;
    
                    $completeLinesNotif[$playerId] = $obj;
    
                    $this->game->incPlayerScore($playerId, $pointsDetail->points);
    
                    $this->playerStats->inc('pointsWallTile', $pointsDetail->points, $playerId, true);
                }
            } else if (count($playerTiles) > 0) {
                $this->playerStats->inc('incompleteLinesAtEndRound', 1, $playerId, true);
            }
        }

        if (count($completeLinesNotif) > 0) {
            $this->notify->all('placeTileOnWall', '', [
                'completeLines' => $completeLinesNotif,
            ]);

            foreach ($completeLinesNotif as $playerId => $notif) {
                $this->notify->all('placeTileOnWallTextLogDetails', clienttranslate('${player_name} places ${number} ${color} and gains ${points} point(s)'), [
                    'player_name' => $this->game->getPlayerNameById($playerId),
                    'number' => 1,
                    'color' => $this->game->getColor($notif->placedTile->type),
                    'i18n' => ['color'],
                    'type' => $notif->placedTile->type,
                    'preserve' => [ 2 => 'type' ],
                    'points' => $notif->pointsDetail->points,
                ]);
            }
        }
    }

    function notifFloorLine(array $playersIds) {
        $floorLinesNotif = [];
        $specialFactoryZeroTiles = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = $this->game->getTilesFromLine($playerId, 0);
            if (count($playerTiles) > 0) {                
                $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $playerTiles), 'discard');
                $points = 0;
                for ($i = 0; $i < min(7, count($playerTiles)); $i++) {
                    $points += $this->getPointsForFloorLine($i);
                }

                $obj = new \stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = -$points;

                $floorLinesNotif[$playerId] = $obj;

                $this->game->decPlayerScore($playerId, $points);

                $this->playerStats->inc('pointsLossFloorLine', $points, $playerId, true);
            } 
            $playerTilesZero = $this->game->getTilesFromLine($playerId, -1);
            $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $playerTilesZero), 'discard');
            $specialFactoryZeroTiles[$playerId] = $playerTilesZero;
        }
        $this->notify->all('emptyFloorLine', '', [
            'floorLines' => $floorLinesNotif,
            'specialFactoryZeroTiles' => $specialFactoryZeroTiles,
        ]);

        foreach ($floorLinesNotif as $playerId => $notif) {
            $this->notify->all('emptyFloorLineTextLogDetails', clienttranslate('${player_name} loses ${points} point(s) with Floor line'), [
                'player_name' => $this->game->getPlayerNameById($playerId),
                'points' => -$notif->points,
            ]);
        }
    }

    function getColumnForTile(int $row, int $type) {
        $indexForDefaultWall = [
            1 => 3,
            2 => 4,
            3 => 0,
            4 => 1,
            5 => 2,
        ];

        return ($row + $indexForDefaultWall[$type] - 1) % 5 + 1;
    }

    function getPointsDetailForPlacedTile(int $playerId, object $tile) {
        $tilesOnWall = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('wall'.$playerId));

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

        $result = new \stdClass;
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

        $fixedColors = $this->game->getBoard()->getFixedColors();
        $fixedTilesForLine = $fixedColors[$tile->line] ?? [];
        $fixedColor = $fixedTilesForLine[$tile->column] ?? null;
        $multiplier = $fixedColor === null ? 1 : ($fixedColor['multiplier'] ?? 1);

        $result->points *= $multiplier;

        return $result;
    }
        
    function getPointsForFloorLine(int $tileIndex) {
        switch ($tileIndex) {
            case 0: case 1: return 1;
            case 2: case 3: case 4: return 2;
            default: return 3;
        }
    }

    function getTileOnWallCoordinates(array $tiles, int $row, int $column) {
        foreach ($tiles as $tile) {
            if ($tile->line == $row && $tile->column == $column) {
                return $tile;
            }
        }
        return null;
    }
}
