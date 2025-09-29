<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\Azul\Boards\Board;
use Bga\Games\Azul\Game;

class EndScore extends \Bga\GameFramework\States\GameState
{

    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_END_SCORE, 
            type: StateType::GAME,
        );
    }

    function onEnteringState() {        
        $playersIds = $this->game->getPlayersIds();
        $board = $this->game->getBoard();

        $walls = [];
        foreach ($playersIds as $playerId) {
            $walls[$playerId] = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('wall'.$playerId));
        }
        
        $fastScoring = $this->game->isFastScoring();
        if ($fastScoring) {
            $this->endScoreNotifs($playersIds, $walls, $board);
        } else {
            foreach($playersIds as $playerId) {
                $this->endScoreNotifs([$playerId], $walls, $board);
            }
        }

        return ST_END_GAME;
    }

    private function endScoreNotifs(array $playersIds, array $walls, Board $board) {
        // Gain 2 points for each complete horizontal line of 5 consecutive tiles on your wall.
        for ($line = 1; $line <= 5; $line++) {
            $this->notifCompleteLines($playersIds, $walls, $line, $board);
        }
        // Gain 7 points for each complete vertical line of 5 consecutive tiles on your wall.
        for ($column = 1; $column <= 5; $column++) {
            $this->notifCompleteColumns($playersIds, $walls, $column, $board);
        }
        // Gain 10 points for each color of which you have placed all 5 tiles on your wall.
        for ($color = 1; $color <= 5; $color++) {
            $this->notifCompleteColors($playersIds, $walls, $color, $board);
        }
    }

    function notifCompleteLines(array $playersIds, array $walls, int $line, Board $board) {        
        $scoresNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = Arrays::filter($walls[$playerId], fn($tile)=> $tile->line == $line);
            usort($playerTiles, fn($a, $b) => $this->game->sortByColumn($a, $b));

            if (count($playerTiles) == 5) {

                $obj = new \stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = $board->getSetPoints()['line'];

                $scoresNotif[$playerId] = $obj;

                $this->game->incPlayerScore($playerId, $obj->points);
                $this->game->incPlayerScoreAux($playerId, 1);

                $this->game->incStat($obj->points, 'pointsCompleteLine');
                $this->game->incStat($obj->points, 'pointsCompleteLine', $playerId);
            }
        }

        if (count($scoresNotif) > 0) {
            $this->notify->all('endScore', '', [
                'scores' => $scoresNotif,
            ]);

            foreach ($scoresNotif as $playerId => $notif) {
                $this->notify->all('completeLineLogDetails', clienttranslate('${player_name} gains ${points} point(s) with complete line ${line}'), [
                    'player_name' => $this->game->getPlayerNameById($playerId),
                    'line' => $notif->tiles[0]->line,
                    'points' => $notif->points,
                ]);
            }
        }
    }

    function sortByLine($a, $b) {
        if ($a->line == $b->line) {
            return 0;
        }
        return ($a->line < $b->line) ? -1 : 1;
    }

    function notifCompleteColumns(array $playersIds, array $walls, int $column, Board $board) {                
        $scoresNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = Arrays::filter($walls[$playerId], fn($tile) => $tile->column == $column);
            usort($playerTiles, fn($a, $b) => $this->sortByLine($a, $b));
            
            if (count($playerTiles) == 5) {

                $obj = new \stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = $board->getSetPoints()['column'];

                $scoresNotif[$playerId] = $obj;

                $this->game->incPlayerScore($playerId, $obj->points);

                $this->game->incStat($obj->points, 'pointsCompleteColumn');
                $this->game->incStat($obj->points, 'pointsCompleteColumn', $playerId);
            }
        }

        if (count($scoresNotif) > 0) {
            $this->notify->all('endScore', '', [
                'scores' => $scoresNotif,
            ]);

            foreach ($scoresNotif as $playerId => $notif) {
                $this->notify->all('completeColumnLogDetails', clienttranslate('${player_name} gains ${points} point(s) with complete column ${column}'), [
                    'player_name' => $this->game->getPlayerNameById($playerId),
                    'column' => $notif->tiles[0]->column,
                    'points' => $notif->points,
                ]);
            }
        }
    }

    function notifCompleteColors(array $playersIds, array $walls, int $color, Board $board) {                
        $scoresNotif = [];
        foreach ($playersIds as $playerId) {
            $playerTiles = Arrays::filter($walls[$playerId], fn($tile) => $tile->type == $color);
            usort($playerTiles, fn($a, $b) => $this->sortByLine($a, $b));
            
            if (count($playerTiles) == 5) {

                $obj = new \stdClass();
                $obj->tiles = $playerTiles;
                $obj->points = $board->getSetPoints()['color'];

                $scoresNotif[$playerId] = $obj;

                $this->game->incPlayerScore($playerId, $obj->points);

                $this->game->incStat($obj->points, 'pointsCompleteColor');
                $this->game->incStat($obj->points, 'pointsCompleteColor', $playerId);
            }
        }

        if (count($scoresNotif) > 0) {
            $this->notify->all('endScore', '', [
                'scores' => $scoresNotif,
            ]);

            foreach ($scoresNotif as $playerId => $notif) {
                $this->notify->all('completeColorLogDetails', clienttranslate('${player_name} gains ${points} point(s) with complete color ${color}'), [
                    'player_name' => $this->game->getPlayerNameById($playerId),
                    'color' => $this->game->getColor($notif->tiles[0]->type),
                    'type' => $notif->tiles[0]->type,
                    'i18n' => ['color'],
                    'points' => $notif->points,
                    'preserve' => [ 2 => 'type' ],
                ]);
            }
        }
    }
}