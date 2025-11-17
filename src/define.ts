define([
    "dojo","dojo/_base/declare",
    getLibUrl('bga-animations', '1.x'),
],
function (dojo, declare, BgaAnimations) {
    window['BgaAnimations'] = BgaAnimations;
    return declare("bgagame.azul", ebg.core.gamegui, new Azul());             
});