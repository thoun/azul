<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\Azul\Game;

class FillFactories extends \Bga\GameFramework\States\GameState
{

    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_FILL_FACTORIES, 
            type: StateType::GAME,

            updateGameProgression: true,
        );
    }

    function onEnteringState() {        
        $playerNumber = intval($this->game->getUniqueValueFromDB("SELECT count(*) FROM player "));

        if ($this->game->isSpecialFactories()) {
            $this->initSpecialFactories($playerNumber);
        }

        $factories = [];

        $firstPlayerTile = $this->game->getTilesFromDb($this->game->tiles->getCardsOfType(0, null))[0];
        $this->game->tiles->moveCard($firstPlayerTile->id, 'factory', 0);
        $factories[0] = [$firstPlayerTile];

        $factoryNumber = $this->game->getFactoryNumber($playerNumber);
        for ($factory=1; $factory<=$factoryNumber; $factory++) {
            $factories[$factory] = $this->game->getTilesFromDb($this->game->tiles->pickCardsForLocation(4, 'deck', 'factory', $factory));
        }

        if ($this->game->getBoard()->getFixedColors() !== null) {
            $this->game->DbQuery("UPDATE player SET selected_columns = '{}'");

            $lastRoundLogged = intval($this->game->getGameStateValue(END_TURN_LOGGED)) > 0;
            if ($lastRoundLogged) {
                $this->game->setGameStateValue(END_TURN_LOGGED, 0);
                $this->notify->all('removeLastRound', '', []);
            }
        }

        $this->notify->all("factoriesFilled", clienttranslate("A new round begins !"), [
            'factories' => $factories,
            'remainingTiles' => intval($this->game->tiles->countCardInLocation('deck')),
        ]);


        $specialFactories = $this->game->isSpecialFactories() ? $this->game->getSpecialFactories() : null;
        if ($specialFactories !== null) {
            for ($factory=1; $factory<=$factoryNumber; $factory++) {
                if (array_key_exists($factory, $specialFactories)) {
                    if ($specialFactories[$factory] <= 5) {
                        $seekedColor = $specialFactories[$factory];
                        $previous = $factory == 1 ? $factoryNumber : $factory - 1;
                        $next = $factory == $factoryNumber ? 1 : $factory + 1;
                        $previousTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $previous));
                        $nextTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $next));
                        $takenPreviousTile = Arrays::find($previousTiles, fn($tile) => $tile->type == $seekedColor);
                        $takenNextTile = Arrays::find($nextTiles, fn($tile) => $tile->type == $seekedColor);

                        if ($takenPreviousTile !== null) {
                            $this->game->tiles->moveCard($takenPreviousTile->id, 'factory', $factory);
                        }
                        if ($takenNextTile !== null) {
                            $this->game->tiles->moveCard($takenNextTile->id, 'factory', $factory);
                        }

                        $partialFactories = [
                            $factory => $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $factory)),
                        ];

                        if ($takenPreviousTile !== null) {
                            $partialFactories[$previous] = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $previous));
                            $this->notify->all("factoriesChanged", '', [
                                'factory' => $factory,
                                'factories' => $partialFactories,
                                'tiles' => [$takenPreviousTile],
                            ]);
                        }
                        if ($takenNextTile !== null) {
                            $partialFactories[$next] = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $next));
                            $this->notify->all("factoriesChanged", '', [
                                'factory' => $factory,
                                'factories' => $partialFactories,
                                'tiles' => [$takenNextTile],
                            ]);
                        }
                    } else if ($specialFactories[$factory] == 9) {
                        $picked = $this->game->tiles->pickCardsForLocation(1, 'deck', 'factory', $factory);

                        if ($picked != null && count($picked) > 0) {
                            $partialFactories = [
                                $factory => $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $factory)),
                            ];

                            $this->notify->all("factoriesCompleted", '', [
                                'factory' => $factory,
                                'factories' => $partialFactories,
                            ]);
                        }
                    }
                }
            }
        }

        $this->tableStats->inc('roundsNumber', 1);
        $this->playerStats->inc('firstPlayer', 1, intval($this->game->getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN)));

        return ChooseTile::class;
    }

    function initSpecialFactories(int $playerCount) {
        $availableFactories = [];
        $availableSpecialFactories = [1,2,3,4,5,6,7,8,9];
        $factoryNumber = $this->game->getFactoryNumber($playerCount);
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

        $this->game->setGlobalVariable(SPECIAL_FACTORIES, $specialFactories);

        $this->notify->all('specialFactories', '', [
            'specialFactories' => $specialFactories,
        ]);
    }
}
