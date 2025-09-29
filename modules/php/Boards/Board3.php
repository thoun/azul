<?php
declare(strict_types=1);

namespace Bga\Games\Azul\Boards;

// Crystal Mozaic: side 1 (orange side)
class Board3 extends Board {

    public function getFixedColors(): ?array {
        return [
            1 => [
                4 => ['color' => 1, 'multiplier' => 2],
            ],
            2 => [
                1 => ['color' => 2, 'multiplier' => 2],
            ],
            3 => [
                3 => ['color' => 4, 'multiplier' => 2],
            ],
            4 => [
                5 => ['color' => 3, 'multiplier' => 2],
            ],
            5 => [
                2 => ['color' => 5, 'multiplier' => 2],
            ],
        ];
    }
}