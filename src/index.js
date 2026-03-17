import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    getDescriptions() {
        return [
            getCreatureDescription(this),
            ...super.getDescriptions()
        ];
    }
}

class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(value - 1);
        });
    }

    getDescriptions() {
        return [
            'Получает на 1 меньше урона',
            ...super.getDescriptions()
        ];
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const { oppositePlayer } = gameContext;
        
        taskQueue.push(onDone => this.view.showAttack(onDone));
        
        for (const oppositeCard of oppositePlayer.table) {
            if (oppositeCard) {
                taskQueue.push(onDone => {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                });
            }
        }
        
        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const count = Lad.getInGameCount();
        Lad.setInGameCount(count + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        const count = Lad.getInGameCount();
        Lad.setInGameCount(count - 1);
        super.doBeforeRemoving(continuation);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    getDescriptions() {
        const descriptions = [];

        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            descriptions.push('Чем их больше, тем они сильнее');
        }

        return [
            ...descriptions,
            ...super.getDescriptions()
        ];
    }
}

function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isDog(card) {
    return card instanceof Dog;
}

function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];

const banditStartDeck = [
    new Lad(),
    new Lad(),
];

const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(1);


game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
