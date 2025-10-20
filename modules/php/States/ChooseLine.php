<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\Azul\Game;

class ChooseLine extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_PLAYER_CHOOSE_LINE, 
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseLine',
            description: clienttranslate('${actplayer} must choose a line to place ${number} ${color}'),
            descriptionMyTurn: clienttranslate('${you} must choose a line to place ${number} ${color}'),
        );
    }

    function getArgs(int $activePlayerId) {
        $tiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('hand', $activePlayerId));

        $number = count($tiles);

        return [
            'lines' => $this->availableLines($activePlayerId),
            'number' => $number,
            'color' => $number > 0 ? $this->game->getColor($tiles[0]->type) : null,
            'i18n' => ['color'],
            'type' => $number > 0 ? $tiles[0]->type : null,
        ];
    }

    #[PossibleAction]
    function actSelectLine(int $line, int $activePlayerId) {
        if (array_search($line, $this->availableLines($activePlayerId)) === false) {
            throw new UserException('Line not available');
        }

        $tiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('hand', $activePlayerId));
        $this->game->placeTilesOnLine($activePlayerId, $tiles, $line, true);

        $lastRoundLogged = intval($this->game->getGameStateValue(END_TURN_LOGGED)) > 0;
        if ($this->game->lineWillBeComplete($activePlayerId, $line) && !$lastRoundLogged) {
            $this->notify->all('lastRound', clienttranslate('${player_name} will complete a line, it\'s last turn !'), [
                'playerId' => $activePlayerId,
                'player_name' => $this->game->getPlayerNameById($activePlayerId),
            ]);
            $this->game->setGameStateValue(END_TURN_LOGGED, 1);
        }

        $this->game->setGlobalVariable(UNDO_PLACE, new \Undo($tiles, null, null, $lastRoundLogged));

        if ($this->game->isUndoActivated($activePlayerId)) {
            return ConfirmLine::class;
        } else {
            return NextPlayer::class;
        }
    }

    #[PossibleAction]
    function actUndoTakeTiles(int $activePlayerId) {
        return $this->game->actUndoTakeTiles($activePlayerId);
    }

    public function zombie(int $playerId) {
        $hand = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('hand', $playerId));
        $playerLines = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('line'.$playerId));
        $playerWallTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('wall'.$playerId));

        $possibleAnswerPoints = $this->game->zombieTurn_chooseLineAnswerPoints($hand[0]->type, count($hand), $playerLines, $playerWallTiles);

        $zombieChoice = $this->getBestZombieChoice($possibleAnswerPoints);
        return $this->actSelectLine($zombieChoice, $playerId);
    }

    function availableLines(int $playerId) {

        $tiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('hand', $playerId));
        if (count($tiles) === 0) {
            return [];
        }
        $color = $tiles[0]->type;

        $playerWallTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('wall'.$playerId));

        $lines = [0];
        for ($i=1; $i<=5; $i++) {
            $lineTiles = $this->game->getTilesFromLine($playerId, $i);
            $playerWallTileLine = Arrays::filter($playerWallTiles, fn($tile) => $tile->line == $i);
            $availableLine = count($lineTiles) == 0 || ($lineTiles[0]->type == $color && count($lineTiles) < $i);
            $availableWall = !$this->game->someOfColor($playerWallTileLine, $color);
            if ($availableLine && $availableWall) {
                $lines[] = $i;
            }
        }

        return $lines;
    }
}
