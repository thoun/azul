<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\StateType;
use Bga\Games\Azul\Game;

class EndRound extends \Bga\GameFramework\States\GameState
{

    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_END_ROUND, 
            type: StateType::GAME,
        );
    }

    function onEnteringState() {        
        if ($this->game->getBoard()->getFixedColors() !== null) {
            return MultiChooseColumns::class;
        } else {
            return PlaceTiles::class;
        }
    }
}
