function get(attr, def) {
    return typeof attr != 'undefined' ? attr : def;
}

function renameProp(oldprop: string, newprop: string, obj: object) {
    if (oldprop in obj) {
        obj[newprop] = obj[oldprop];
        delete obj[oldprop]; // Delete the original property
    }
}

const toRename = {
    start_on_load: 'startOnLoad',
    shuffle_answers: 'shuffleAnswers',
    shuffle_questions: 'shuffleQuestions',
    primary_color: 'primaryColor',
    secondary_color: 'secondaryColor',
    text_color: 'textColor',
    author_name: 'authorName',
    author_url: 'authorUrl',
    author_image_url: 'authorImageUrl',
    author_image: 'authorImageUrl',
    authorImage: 'authorImageUrl',
};

export function standardizeNames(options: object) {
    /* Renames the underscore variables to camelCase versions */
    for (const oldName in toRename) {
        renameProp(oldName, toRename[oldName], options);
    }
}

export class Config {
    startOnLoad: boolean;
    shuffleAnswers: boolean;
    shuffleQuestions: boolean;
    nQuestions: number | undefined;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    locale: 'de' | 'en' | 'es' | 'fr' | null;
    skipIntro: boolean; // an intro screen shows start button and minor description
    title: string;
    authorName: string;
    authorUrl: string;
    authorImageUrl: string;
    description: string;
    quizId: string | null;

    // editor specific
    activeLineNumber: number;
    activeQuestion: number;

    constructor(options: Config | object) {
        // handle <=v0.3.0 snake_case options for backwards compatibility

        this.startOnLoad = get(options['startOnLoad'], true);
        this.shuffleAnswers = get(options['shuffleAnswers'], false);
        this.shuffleQuestions = get(options['shuffleQuestions'], false);
        this.nQuestions = get(options['nQuestions'], undefined);
        this.primaryColor = get(options['primaryColor'], 'steelblue');
        this.secondaryColor = get(options['secondaryColor'], '#f2f2f2');
        this.textColor = get(options['textColor'], 'black');
        this.locale = get(options['locale'], null);
        this.skipIntro = get(options['locale'], false);
        this.quizId = get(options['quizId'], 'quiz-0');
        this.authorName = get(options['authorName'], '');
        this.authorUrl = get(options['authorUrl'], '');
        this.authorImageUrl = get(options['authorImageUrl'], '');
        this.title = get(options['title'], '');
        this.description = get(options['description'], '');
    }
}

export function mergeAttributes(baseConfig: Config, newConfig: Config): Config {
    //newConfig overwrites entries in baseConfig
    let config = new Config(baseConfig);
    for (let attrname in newConfig) {
        if (Object.prototype.hasOwnProperty.call(newConfig, attrname)) {
            config[attrname] = newConfig[attrname];
        }
    }
    return config;
}
