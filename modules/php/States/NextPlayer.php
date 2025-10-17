<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\StateType;
use Bga\Games\Azul\Game;

class NextPlayer extends \Bga\GameFramework\States\GameState
{

    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_NEXT_PLAYER, 
            type: StateType::GAME,
        );
    }


    function onEnteringState(int $activePlayerId) {
        $factoriesAllEmpty = $this->game->tiles->countCardInLocation('factory') == 0;

        $this->playerStats->inc('turnsNumber', 1, $activePlayerId, true);

        if ($factoriesAllEmpty) {
            return EndRound::class;
        } else {
            $this->game->activeNextPlayer();
        
            $playerId = (int)$this->game->getActivePlayerId();
            $this->game->giveExtraTime($playerId);

            return ChooseTile::class;
        }
    }
}
