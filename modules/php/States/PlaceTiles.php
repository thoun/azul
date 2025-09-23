<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\StateType;
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
        $playersIds = $this->game->getPlayersIds();

        $this->notifPlaceLines($playersIds);
    
        $firstPlayerTile = $this->game->getTilesFromDb($this->game->tiles->getCardsOfType(0))[0];
        $this->game->tiles->moveCard($firstPlayerTile->id, 'factory', 0);

        if (intval($this->game->getGameStateValue(SPECIAL_FACTORY_ZERO_OWNER)) > 0) {
            $this->game->setGameStateValue(SPECIAL_FACTORY_ZERO_OWNER, 0);
            $this->notify->all('moveSpecialFactoryZero', '', [
                'playerId' => 0,
            ]);
        }

        if ($this->game->getGameProgression() == 100) {
            return ST_END_SCORE;
        } else {
            $playerId = intval($this->game->getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
            $this->gamestate->changeActivePlayer($playerId);
            $this->game->giveExtraTime($playerId);

            return ST_FILL_FACTORIES;
        }
    }

    function notifPlaceLines(array $playersIds) {
        $fastScoring = $this->game->isFastScoring();

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

    function notifPlaceLine(array $playersIds, int $line) {
        $completeLinesNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = $this->game->getTilesFromLine($playerId, $line);
            if (count($playerTiles) == $line) {
                
                $wallTile = $playerTiles[0];
                $column = null;
                if ($this->game->isVariant()) {
                    $selectedColumns = $this->game->getSelectedColumns($playerId);
                    if (!array_key_exists($line, $selectedColumns)) {
                        // happens when a player left the game with a complete row
                        $column = 0;
                    } else {
                        $column = $selectedColumns[$line];
                    }
                } else {
                    $column = $this->game->getColumnForTile($line, $wallTile->type);
                }

                if ($column == 0) {
                    // variant : we place tiles on floor line, count will be done after
                    $this->game->placeTilesOnLine($playerId, $playerTiles, 0, false);
                } else {
                    $wallTile->column = $column;
                    $discardedTiles = array_slice($playerTiles, 1);
                    $this->game->tiles->moveCard($wallTile->id, 'wall'.$playerId, $line*100 + $wallTile->column);
                    $this->game->tiles->moveCards(array_map('getIdPredicate', $discardedTiles), 'discard');
    
                    $pointsDetail = $this->game->getPointsDetailForPlacedTile($playerId, $wallTile);
    
                    $obj = new \stdClass();
                    $obj->placedTile = $wallTile;
                    $obj->discardedTiles = $discardedTiles;
                    $obj->pointsDetail = $pointsDetail;
    
                    $completeLinesNotif[$playerId] = $obj;
    
                    $this->game->incPlayerScore($playerId, $pointsDetail->points);
    
                    $this->game->incStat($pointsDetail->points, 'pointsWallTile');
                    $this->game->incStat($pointsDetail->points, 'pointsWallTile', $playerId);
                }
            } else if (count($playerTiles) > 0) {
                $this->game->incStat(1, 'incompleteLinesAtEndRound');
                $this->game->incStat(1, 'incompleteLinesAtEndRound', $playerId);
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
                $this->game->tiles->moveCards(array_map('getIdPredicate', $playerTiles), 'discard');
                $points = 0;
                for ($i = 0; $i < min(7, count($playerTiles)); $i++) {
                    $points += $this->game->getPointsForFloorLine($i);
                }

                $obj = new \stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = -$points;

                $floorLinesNotif[$playerId] = $obj;

                $this->game->decPlayerScore($playerId, $points);

                $this->game->incStat($points, 'pointsLossFloorLine');
                $this->game->incStat($points, 'pointsLossFloorLine', $playerId);
            } 
            $playerTilesZero = $this->game->getTilesFromLine($playerId, -1);
            $this->game->tiles->moveCards(array_map('getIdPredicate', $playerTilesZero), 'discard');
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
}
