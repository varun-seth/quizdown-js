import DOMPurify from 'dompurify';
import stripIndent from 'strip-indent';
import {
    Quiz,
    BaseQuestion,
    MultipleChoice,
    SingleChoice,
    NoChoiceQuestion,
    Information,
    Sequence,
    Answer,
    QuestionType,
} from './quiz';
import { Config, mergeAttributes } from './config';
import marked from './customizedMarked';

function parseQuizdown(rawQuizdown: string, globalConfig: Config): Quiz {
    let tokens = tokenize(rawQuizdown);

    let { title, description, firstQuestionIdx } =
        extractTitleAndDescription(tokens);

    let activeQuestion: number;

    if (globalConfig.activeLineNumber) {
        activeQuestion = findQuestionByLineNumber(
            tokens,
            globalConfig.activeLineNumber
        );
        if (title) {
            activeQuestion -= 1;
        }
    }

    let quizConfig = new Config(globalConfig);

    if (hasQuizOptions(tokens)) {
        quizConfig = parseOptions(tokens, quizConfig);
    }

    if (activeQuestion >= 0) {
        quizConfig.activeQuestion = activeQuestion;
    }

    let questions = extractQuestions(
        tokens.slice(firstQuestionIdx),
        quizConfig
    );

    if (title) {
        quizConfig.title = title;
    }
    if (description) {
        quizConfig.description = description;
    }

    return new Quiz(questions, quizConfig);
}

function tokenize(rawQuizdown: string): marked.TokensList {
    return marked.lexer(htmlDecode(stripIndent(rawQuizdown)));
}

function findQuestionByLineNumber(tokens: marked.Token[], lineNumber: number) {
    let lineCount = 1;
    let questionNumber = -1;

    for (const token of tokens) {
        if (token.type === 'heading') {
            questionNumber++;
        }
        if (token.raw.includes('\n')) {
            lineCount += token.raw.split('\n').length - 1;
        }
        if (lineCount > lineNumber) {
            return questionNumber;
        }
    }
    return questionNumber;
}

function hasQuizOptions(tokens: marked.TokensList) {
    // type definition does not allow custom token types
    // @ts-ignore
    let optionsIdx = tokens.findIndex((token) => token['type'] == 'options');
    let headingIdx = tokens.findIndex((token) => token['type'] == 'heading');
    // quiz options appear at the top before the first heading
    return optionsIdx !== -1 && headingIdx > optionsIdx;
}

function findNextHeadingIdx(
    tokens: marked.Token[],
    startIndex: number = 0
): number {
    for (let i = startIndex; i < tokens.length; i++) {
        if (tokens[i]['type'] == 'heading') {
            return i;
        }
    }
    return -1;
}

function extractTitleAndDescription(tokens) {
    let title: string;
    let description: string;
    let firstHeadingIndex = findNextHeadingIdx(tokens, 0);
    let descriptionTokens = [];
    let firstQuestionIdx = -1;

    if (firstHeadingIndex !== -1 && tokens[firstHeadingIndex].depth === 1) {
        title = tokens[firstHeadingIndex].text;

        let nextQuestionIdx = findNextHeadingIdx(tokens, firstHeadingIndex + 1);

        if (nextQuestionIdx !== -1) {
            firstQuestionIdx = nextQuestionIdx;

            // Collect tokens for description between the title and the next question
            descriptionTokens = tokens.slice(
                firstHeadingIndex + 1,
                firstQuestionIdx
            );
        } else {
            // If no next question, all remaining tokens are part of description
            descriptionTokens = tokens.slice(firstHeadingIndex + 1);
        }
        description = parseTokens(descriptionTokens);
    } else {
        firstQuestionIdx = firstHeadingIndex;
    }

    return { title, description, firstQuestionIdx };
}

function parseOptions(tokens: marked.Token[], quizConfig: Config): Config {
    // type definition does not allow custom token types
    // @ts-ignore
    let options = tokens.find((token) => token.type == 'options');
    let data = options['data'];
    if (data['description']) {
        data['description'] = DOMPurify.sanitize(data['description']);
    }
    return mergeAttributes(quizConfig, data);
}

function extractQuestions(
    tokens: marked.Token[],
    config: Config
): BaseQuestion[] {
    let questions: BaseQuestion[] = [];
    let startIdx = 0;

    while (startIdx < tokens.length) {
        let nextQuestionIdx = findNextHeadingIdx(tokens, startIdx + 1);

        if (nextQuestionIdx == -1) {
            nextQuestionIdx = tokens.length;
        }

        let currentTokens = tokens.slice(startIdx, nextQuestionIdx);
        let questionType = determineQuestionType(currentTokens);

        if (questionType != 'InvalidQuestion') {
            let question = parseQuestion(questionType, currentTokens, config);
            questions.push(question);
        } else {
            if (
                config.activeLineNumber >= 0 &&
                config.activeLineNumber >= questions.length - 1
            ) {
                config.activeLineNumber -= 1;
            }
        }
        startIdx = nextQuestionIdx; // Move start index forward to the next question's start or to the end of the array
    }
    return questions;
}

function parseQuestion(
    questionType: QuestionType,
    tokens: marked.Token[],
    config: Config
): BaseQuestion {
    let explanation = parseExplanation(tokens);
    let hint = parseHint(tokens);
    let heading = parseHeading(tokens);
    let answers = parseAnswers(tokens);
    let questionConfig = new Config(config);
    const args = [heading, explanation, hint, answers, questionConfig] as const;
    switch (questionType) {
        case 'SingleChoice':
            return new SingleChoice(...args);
        case 'MultipleChoice':
            return new MultipleChoice(...args);
        case 'Sequence':
            return new Sequence(...args);
        case 'NoChoiceQuestion':
            return new NoChoiceQuestion(...args);
        case 'Information':
            return new Information(...args);
    }
}

function parseHint(tokens: marked.Token[]): string {
    let blockquotes = tokens.filter((token) => token['type'] == 'blockquote');
    return parseTokens(blockquotes);
}

function parseExplanation(tokens: marked.Token[]): string {
    let explanations = tokens.filter(
        (token) => token['type'] == 'paragraph' || token['type'] == 'code'
    );
    return parseTokens(explanations);
}

function parseHeading(tokens: marked.Token[]): string {
    let headings = tokens.filter((token) => token['type'] == 'heading');
    return parseTokens(headings);
}

function parseAnswers(tokens: marked.Token[]): Array<Answer> {
    let list = tokens.find(
        (token) => token.type == 'list'
    ) as marked.Tokens.List;
    if (list == undefined) {
        return [];
    }
    let answers: Array<Answer> = [];
    list.items.forEach(function (item, i) {
        let answer = parseAnswer(item);
        answers.push(
            new Answer(i, answer['text'], item['checked'], answer['comment'])
        );
    });
    return answers;
}

function parseAnswer(item: marked.Tokens.ListItem) {
    let comments = item['tokens'].filter((token) => token.type == 'blockquote');
    let texts = item['tokens'].filter((token) => token.type != 'blockquote');
    return { text: parseTokens(texts), comment: parseTokens(comments) };
}

function determineQuestionType(tokens: marked.Token[]): QuestionType {
    let list = tokens.find(
        (token) => token.type == 'list'
    ) as marked.Tokens.List;
    if (!list || !(list as marked.Tokens.List).items.length) {
        // If there's no list or the list is empty, return 'Invalid' to indicate no valid question type
        return 'Information';
    }
    let checkedItems = list.items.filter((item) => item.checked);
    let uncheckedItems = list.items.filter((item) => !item.checked);

    if (list.ordered && !list.items.some((item) => item.task)) {
        return 'Sequence';
    } else if (!list.ordered && !list.items.some((item) => item.task)) {
        // Blanks
        return 'Sequence';
    } else if (checkedItems.length === 1) {
        return 'SingleChoice';
    } else if (checkedItems.length > 1) {
        return 'MultipleChoice';
    } else {
        // helpful in editor when writing question.
        return 'NoChoiceQuestion';
    }
}

function parseTokens(tokens: marked.Token[]): string {
    return DOMPurify.sanitize(marked.parser(tokens as marked.TokensList));
}

function htmlDecode(text: string) {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

export default parseQuizdown;
