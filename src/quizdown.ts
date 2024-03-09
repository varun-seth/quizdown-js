import App from './App.svelte';
import parseQuizdown from './parser.js';
import { Config } from './config.js';
import marked from './customizedMarked.js';
import type { Quiz } from './quiz';
import Toolbar from './Toolbar.svelte';
import Fetcher from './Fetcher.svelte';

export interface Quizdown {
    register(extension: QuizdownExtension): Quizdown;
    createApp(rawQuizdown: string, node: Element, config: Config): App;
    parseQuizdown(rawQuizdown: string, config: Config): Quiz;
    init(config: object): void;
    getMarkedParser(): typeof marked;
    createToolbar(node: Element): Toolbar;
    createFetcher(node: Element): Fetcher;
}

export interface QuizdownExtension {
    setup(quizdown: Quizdown): void;
}

function register(extension: QuizdownExtension): Quizdown {
    extension.setup(this as Quizdown);
    return this as Quizdown;
}

function createApp(rawQuizdown: string, node: Element, config: Config): App {
    node.innerHTML = '';
    let root: ShadowRoot;
    if (!!node.shadowRoot) {
        //clear root if it allready exists
        root = node.shadowRoot;
        root.innerHTML = '';
    } else {
        root = node.attachShadow({ mode: 'open' });
    }

    let quiz = parseQuizdown(rawQuizdown, config);
    let app = new App({
        // https://github.com/sveltejs/svelte/pull/5870
        target: root,
        intro: false,
        props: {
            quiz: quiz,
        },
    });
    return app;
}

function init(config: object = {}): void {
    let globalConfig = new Config(config);
    if (globalConfig.startOnLoad) {
        if (typeof document !== 'undefined') {
            window.addEventListener(
                'load',
                function () {
                    let nodes = document.querySelectorAll('.quizdown');
                    for (let node of nodes) {
                        createApp(node.innerHTML, node, globalConfig);
                    }
                },
                false
            );
        }
    }
}

function getMarkedParser(): typeof marked {
    return marked;
}

function createToolbar(node: Element): Toolbar {
    node.innerHTML = '';
    let root: ShadowRoot;
    if (!!node.shadowRoot) {
        //clear root if it allready exists
        root = node.shadowRoot;
        root.innerHTML = '';
    } else {
        root = node.attachShadow({ mode: 'open' });
    }

    let toolbar = new Toolbar({
        target: root,
        props: {},
    });
    return toolbar;
}

function createFetcher(node: Element): Fetcher {
    node.innerHTML = '';
    let root: ShadowRoot;
    if (!!node.shadowRoot) {
        //clear root if it allready exists
        root = node.shadowRoot;
        root.innerHTML = '';
    } else {
        root = node.attachShadow({ mode: 'open' });
    }

    let fetcher = new Fetcher({
        target: root,
        props: {},
    });
    return fetcher;
}

let quizdown: Quizdown = {
    init,
    register,
    parseQuizdown,
    createApp,
    getMarkedParser,
    createToolbar,
    createFetcher,
};

export default quizdown;
