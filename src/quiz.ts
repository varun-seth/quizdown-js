import { writable, get, Writable } from 'svelte/store';
import autoBind from 'auto-bind';
import type { Config } from './config.js';

function isEqual(a1: Array<number>, a2: Array<number>): boolean {
    return JSON.stringify(a1) === JSON.stringify(a2);
}

function shuffle(array: Array<any>, n: number | undefined): Array<any> {
    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array.slice(0, n);
}

// we need to reference the classes in the svelte app despite minifaction of class names
export type QuestionType =
    | 'MultipleChoice'
    | 'SingleChoice'
    | 'NoChoiceQuestion'
    | 'Sequence'
    | 'Information'
    | 'InvalidQuestion';

export abstract class BaseQuestion {
    readonly text: string;
    answers: Array<Answer>;
    initialOrder: Array<number>;
    readonly explanation: string;
    selected: Array<number>;
    solved: boolean;
    readonly hint: string;
    readonly questionType: QuestionType;
    readonly options: Config;
    showHint: Writable<boolean>;
    visited: boolean;
    readonly points: number;
    index: number;
    quizId: string;

    constructor(
        text: string,
        explanation: string,
        hint: string,
        answers: Array<Answer>,
        questionType: QuestionType,
        options: Config,
        points: number = 1
    ) {
        this.points = points;
        this.text = text;
        this.explanation = explanation;
        this.hint = hint;
        this.solved = false;
        this.showHint = writable(false);
        this.options = options;
        this.answers = answers;
        this.questionType = questionType;
        this.visited = false;
        autoBind(this);
        this.reset(); // shuffles if needed
    }

    toggleHint() {
        this.showHint.update((value) => !value);
    }

    reset() {
        this.selected = [];
        this.delState();
        this.solved = false;
        this.visited = false;
        this.showHint.set(false);
        if (this.options.shuffleAnswers) {
            this.answers = shuffle(this.answers, this.answers.length);
        }
        this.initialOrder = this.answers.map((answer) => answer.id);
    }

    setQuizId(quizId: string) {
        this.quizId = quizId;
    }

    getStateKey() {
        return `${this.quizId}.${this.index}`;
    }
    getOrderKey() {
        return `${this.quizId}.${this.index}~`;
    }

    delState() {
        if (!this.quizId) {
            return;
        }
        sessionStorage.removeItem(this.getStateKey());
        sessionStorage.removeItem(this.getOrderKey());
    }
    saveState() {
        if (!this.quizId) {
            return;
        }
        sessionStorage.setItem(
            this.getStateKey(),
            JSON.stringify(this.selected)
        );
    }
    saveOrder() {
        if (!this.quizId) {
            return;
        }
        if (this.options.shuffleAnswers) {
            sessionStorage.setItem(
                this.getOrderKey(),
                JSON.stringify(this.initialOrder)
            );
        }
    }
    loadState() {
        if (!this.quizId) {
            return;
        }
        let value = sessionStorage.getItem(this.getStateKey());
        if (value !== null && value != undefined) {
            this.selected = JSON.parse(value);
            this.visited = true;
        }
    }
    loadOrder() {
        if (!this.quizId) {
            return;
        }
        // fix shuffling.
        if (this.options.shuffleAnswers) {
            // restores to inital view of a question across reloads.
            let order = sessionStorage.getItem(this.getOrderKey());
            if (order !== undefined && order !== null) {
                let values = JSON.parse(order);
                this.initialOrder = values;
                sortByOrder(this.answers, values);
            }
            if (this.questionType == 'Sequence') {
                // for sequence-view questions, sort by selected.
                sortByOrder(this.answers, this.selected);
            }
        }
    }

    abstract isCorrect(): boolean;
}

function sortByOrder(array: Array<Answer>, order: Array<number>) {
    const orderIndexMap = new Map();
    order.forEach((id, index) => {
        orderIndexMap.set(id, index);
    });

    // Sort the array based on the precomputed index positions
    array.sort((a, b) => {
        const indexOfA = orderIndexMap.get(a.id);
        const indexOfB = orderIndexMap.get(b.id);
        return indexOfA - indexOfB;
    });
}

class Blanks extends BaseQuestion {
    isCorrect() {
        this.solved = false;
        return this.solved;
    }
}

class Pairs extends BaseQuestion {
    isCorrect() {
        this.solved = false;
        return this.solved;
    }
}

export class Sequence extends BaseQuestion {
    constructor(
        text: string,
        explanation: string,
        hint: string,
        answers: Array<Answer>,
        options: Config
    ) {
        // always enable shuffling for sequence questions
        options.shuffleAnswers = true;
        super(text, explanation, hint, answers, 'Sequence', options);
    }

    isCorrect() {
        // extract answer ids from answers
        let trueAnswerIds = this.answers.map((answer) => answer.id);
        this.solved = isEqual(trueAnswerIds.sort(), this.selected);
        return this.solved;
    }
}

class Choice extends BaseQuestion {
    isCorrect() {
        let trueAnswerIds = this.answers
            .filter((answer) => answer.correct)
            .map((answer) => answer.id);
        let selectedAnswerIds = this.selected.map((i) => this.answers[i].id);
        this.solved = isEqual(trueAnswerIds.sort(), selectedAnswerIds.sort());
        return this.solved;
    }
}

export class MultipleChoice extends Choice {
    constructor(
        text: string,
        explanation: string,
        hint: string,
        answers: Array<Answer>,
        options: Config
    ) {
        super(text, explanation, hint, answers, 'MultipleChoice', options);
    }
}

export class SingleChoice extends Choice {
    constructor(
        text: string,
        explanation: string,
        hint: string,
        answers: Array<Answer>,
        options: Config
    ) {
        super(text, explanation, hint, answers, 'SingleChoice', options);
        let nCorrect = this.answers.filter((answer) => answer.correct).length;
        if (nCorrect > 1) {
            throw 'Single Choice questions can not have more than one correct answer.';
        }
    }
}

export class NoChoiceQuestion extends Choice {
    constructor(
        text: string,
        explanation: string,
        hint: string,
        answers: Array<Answer>,
        options: Config
    ) {
        super(text, explanation, hint, answers, 'NoChoiceQuestion', options, 0);
    }
    isCorrect() {
        this.solved = true;
        return this.solved;
    }
}

export class Information extends BaseQuestion {
    constructor(
        text: string,
        explanation: string,
        hint: string,
        answers: Array<Answer>,
        options: Config
    ) {
        super(text, explanation, hint, answers, 'Information', options, 0);
    }
    isCorrect() {
        this.solved = true;
        return this.solved;
    }
}

export class Answer {
    html: string;
    correct: boolean;
    id: number;
    comment: string;

    constructor(id: number, html: string, correct: boolean, comment: string) {
        this.html = html;
        this.correct = correct;
        this.id = id;
        this.comment = comment;
        autoBind(this);
    }
}

function filenameToTitle(filename: string): string {
    if (filename.endsWith('.md')) {
        filename = filename.slice(0, -3);
    }

    const words = filename.replace(/_/g, ' ').split(' ');

    const titleCaseString = words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return titleCaseString;
}

export class Quiz {
    questions: Array<BaseQuestion>;
    active: Writable<BaseQuestion>;
    index: Writable<number>;
    config: Config;
    onLast: Writable<boolean>; // index n-1
    onIntro: Writable<boolean>; // index -1
    onResults: Writable<boolean>; // index n
    onFirst: Writable<boolean>;
    isStarted: Writable<boolean>;
    isEvaluated: Writable<boolean>;
    allVisited: Writable<boolean>;
    onSolutions: Writable<boolean>;

    constructor(questions: Array<BaseQuestion>, config: Config) {
        this.questions = questions;
        this.config = config;

        if (!this.config.title && this.config.filename) {
            this.config.title = filenameToTitle(this.config.filename);
        }

        if (this.config.shuffleQuestions) {
            this.questions = shuffle(this.questions, this.config.nQuestions);
        }
        let i = 0;
        for (let question of this.questions) {
            question.index = i;
            i++;
        }

        if (!this.config.shuffleQuestions && config.quizId) {
            // if questions are not shuffled, then answers can be saved reliably.
            this.questions.forEach((q) => {
                q.setQuizId(this.config.quizId);
                q.loadState();
                q.loadOrder();
            });
        }

        if (this.questions.length == 0) {
            console.warn('No questions for quiz provided');
        }
        // setup first question
        this.active = writable(undefined);
        this.onIntro = writable(true);
        this.isStarted = writable(false);
        this.onFirst = writable(false);
        this.onLast = writable(this.questions.length == 1);
        this.onResults = writable(false);
        this.allVisited = writable(this.questions.length == 1);
        this.isEvaluated = writable(false);
        this.onSolutions = writable(false);
        autoBind(this);

        let index = -1;

        if (config.activeQuestion != undefined && config.activeQuestion >= 0) {
            index = config.activeQuestion;
        } else {
            let savedIndex = this.loadIndex();
            if (
                savedIndex !== null &&
                savedIndex !== undefined &&
                typeof savedIndex == 'number' &&
                0 <= savedIndex &&
                savedIndex <= this.questions.length
            ) {
                index = savedIndex;
            }
        }

        this.index = writable(index);
        if (index >= 0) {
            this.jump(index);
        }
    }

    private setActive() {
        let idx = get(this.index);
        this.active.update((act) => this.questions[idx]);
        if (!this.questions[idx].visited) {
            // first time.
            this.questions[idx].saveOrder();
            this.questions[idx].saveState();
        }
        this.questions[idx].visited = true;
    }

    private checkAllVisited(): boolean {
        for (let question of this.questions) {
            if (!question.visited) {
                return false;
            }
        }
        return true;
    }

    jump(index: number): boolean {
        if (-1 <= index && index <= this.questions.length) {
            this.index.set(index);
            this.isStarted.set(index !== -1);
            this.onIntro.set(index === -1);
            this.onFirst.set(index == 0);
            this.onLast.set(index == this.questions.length - 1);
            this.onResults.set(index == this.questions.length);
            this.saveIndex(index);
        } else {
            return false;
        }
        if (index == -1) {
            // This only occurs when reset button is pressed.
            this.delIndex();
        } else if (0 <= index && index <= this.questions.length - 1) {
            // on a question
            this.setActive();
            this.allVisited.set(this.checkAllVisited());
        } else if (index == this.questions.length) {
            // on results page
            return true;
        }
        return true;
    }

    getIndexKey() {
        return `${this.config.quizId}#`;
    }

    saveIndex(index: number) {
        if (!this.config.quizId) {
            return;
        }
        sessionStorage.setItem(this.getIndexKey(), JSON.stringify(index));
    }
    loadIndex(): number {
        if (!this.config.quizId) {
            return;
        }
        const index = sessionStorage.getItem(this.getIndexKey());
        if (index !== null) {
            return JSON.parse(index);
        }
    }
    delIndex() {
        if (!this.config.quizId) {
            return;
        }
        sessionStorage.removeItem(this.getIndexKey());
    }

    toggleSolutions(): void {
        this.onSolutions.update((value) => !value);
    }

    next(): boolean {
        return this.jump(get(this.index) + 1);
    }

    previous(): boolean {
        return this.jump(get(this.index) - 1);
    }

    reset(): Boolean {
        this.onIntro.set(true);
        this.onFirst.set(false);
        this.onLast.set(false);
        this.onResults.set(false);
        this.allVisited.set(false);
        this.isStarted.set(false);
        this.isEvaluated.set(false);
        this.questions.forEach((q) => q.reset());
        this.onSolutions.set(false);
        return this.jump(-1);
    }

    pointsTotal(): number {
        let total = 0;
        for (let q of this.questions) {
            total += q.points;
        }
        return total;
    }

    evaluate(): number {
        let score = 0;
        for (var q of this.questions) {
            if (q.isCorrect()) {
                score += q.points;
            }
        }
        this.isEvaluated.set(true);
        return score;
    }
}
