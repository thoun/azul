<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\Azul\Game;

class ChooseTile extends \Bga\GameFramework\States\GameState
{

    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_PLAYER_CHOOSE_TILE, 
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseTile',
            description: clienttranslate('${actplayer} must choose tiles'),
            descriptionMyTurn: clienttranslate('${you} must choose tiles'),
        );
    }

    #[PossibleAction]
    function actTakeTiles(int $id, int $activePlayerId) {
        // for undo
        $previousFirstPlayer = intval($this->game->getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));

        $tile = $this->game->getTileFromDb($this->game->tiles->getCard($id));

        if ($tile->location !== 'factory') {
            throw new \BgaUserException("Tile is not in a factory");
        }
        if ($tile->type === 0) {
            throw new \BgaUserException("Tile is First Player token");
        }

        $factory = $tile->column;
        $factoryTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $factory));
        
        $firstPlayerTokens = [];
        $selectedTiles = [];
        $discardedTiles = [];
        $hasFirstPlayer = false;

        $specialFactories = null;

        $takeFromSpecialFactoryZero = false;
        $specialFactories = $this->game->isSpecialFactories() ? $this->game->getSpecialFactories() : null;

        if ($factory == 0) {
            $firstPlayerTokens = Arrays::filter($factoryTiles, fn($fpTile) => $fpTile->type == 0);
            $hasFirstPlayer = count($firstPlayerTokens) > 0;

            foreach($factoryTiles as $factoryTile) {
                if ($tile->type == $factoryTile->type) {
                    $selectedTiles[] = $factoryTile;
                }
            }

            $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $selectedTiles), 'hand', $activePlayerId);

            if ($hasFirstPlayer) {
                $this->game->putFirstPlayerTile($firstPlayerTokens, $activePlayerId);
            }
        } else {
            $discardOtherTiles = true;

            if ($specialFactories !== null && array_key_exists($factory, $specialFactories)) {
                if ($specialFactories[$factory] == 6) {
                    $takeFromSpecialFactoryZero = true;
                    $this->game->setGameStateValue(SPECIAL_FACTORY_ZERO_OWNER, $activePlayerId);
                } else if (in_array($specialFactories[$factory], [7, 8])) {
                    $discardOtherTiles = false;
                }
            }

            foreach($factoryTiles as $factoryTile) {
                if ($tile->type == $factoryTile->type) {
                    $selectedTiles[] = $factoryTile;
                } else if ($discardOtherTiles) {
                    $discardedTiles[] = $factoryTile;
                }
            }

            $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $selectedTiles), 'hand', $activePlayerId);
            $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $discardedTiles), 'factory', 0);
        }

        
        if ($hasFirstPlayer) {
            $message = clienttranslate('${player_name} takes ${number} ${color} and First Player tile');
        } else {
            $message = clienttranslate('${player_name} takes ${number} ${color}');
        }

        $this->notify->all('tilesSelected', $message, [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'number' => count($selectedTiles),
            'color' => $this->game->getColor($tile->type),   
            'i18n' => ['color'],           
            'type' => $tile->type,
            'preserve' => [ 2 => 'type' ],
            'selectedTiles' => $selectedTiles,
            'discardedTiles' => $discardedTiles,
            'fromFactory' => $factory,
        ]);

        if ($takeFromSpecialFactoryZero) {
            $this->notify->all('moveSpecialFactoryZero', '', [
                'playerId' => $activePlayerId,
            ]);
        }

        $this->game->setGlobalVariable(UNDO_SELECT, new \Undo(
            array_merge($selectedTiles, $discardedTiles, $firstPlayerTokens),
            $factory, 
            $previousFirstPlayer,
            null,
            $takeFromSpecialFactoryZero
        ));

        $transition = ChooseLine::class;
        $this->game->setGlobalVariable(UNDO_FACTORY, null);
        if ($specialFactories !== null && array_key_exists($factory, $specialFactories) && $specialFactories[$factory] == 7) {
            $remainingFactoryTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $factory));
            if (count($remainingFactoryTiles) > 0) {
                $this->game->setGlobalVariable(UNDO_FACTORY, new \Undo($remainingFactoryTiles, $factory));
                $transition = ChooseFactory::class;
            }
        }

        return $transition;
    }

    public function zombie(int $playerId) {
        $factoryTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory'));
        $tiles = Arrays::filter($factoryTiles, fn($tile) => $tile->type > 0);

        $playerLines = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('line'.$playerId));
        $playerWallTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('wall'.$playerId));

        $possibleAnswerPoints = [];
        foreach ($tiles as $tile) {
            $tilesOfSameColorInFactory = Arrays::filter($tiles, fn($t) => $tile->column == $t->column && $tile->type == $t->type);
            $possibleAnswerPoints[$tile->id] = $this->game->zombieTurn_chooseLineAnswerPoints($tile->type, count($tilesOfSameColorInFactory), $playerLines, $playerWallTiles);
        }

        $zombieChoice = $this->getBestZombieChoice($possibleAnswerPoints);
        return $this->actTakeTiles($zombieChoice, $playerId);
    }
}
