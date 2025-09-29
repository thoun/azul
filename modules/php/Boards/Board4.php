<?php
declare(strict_types=1);

namespace Bga\Games\Azul\Boards;

// Crystal Mozaic: side 2 (red side)
class Board4 extends Board {
    public function getSetPoints(): array {
        return [
            'line' => 3,
            'column' => 10,
            'color' => 12,
        ];
    }

    public function getFixedColors(): ?array {
        return [
            2 => [
                2 => ['color' => 3],
                4 => ['color' => 5],
            ],
            3 => [
                3 => ['color' => 2],
            ],
            4 => [
                2 => ['color' => 1],
                4 => ['color' => 4],
            ],
        ];
    }
}