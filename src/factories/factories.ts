const FACTORY_RADIUS = 125;

class Factories {
    constructor(
        private game: AzulGame, 
        private factoryNumber: number,
    ) {
        const factoriesDiv = document.getElementById('factories');

        const radius = 40 + factoryNumber*40;
        const centerX = factoriesDiv.clientWidth / 2;
        const centerY = radius + FACTORY_RADIUS;
        factoriesDiv.style.height = `${centerY*2}px`;

        let html = `<div>`;
        for (let i=1; i<=factoryNumber; i++) {
            html += `<div id="factory${i}" class="factory" style="left: ${centerX-FACTORY_RADIUS}px; top: ${centerY-FACTORY_RADIUS}px; transform: rotate(${(i-1)*360/factoryNumber}deg) translateY(-${radius}px);"></div>`;
        }
        html += `</div>`;

        dojo.place(html, 'factories');
    }
}