import DOMPurify from 'dompurify';
import stripIndent from 'strip-indent';
import {
    Quiz,
    BaseQuestion,
    MultipleChoice,
    SingleChoice,
    Sequence,
    Answer,
    QuestionType,
} from './quiz';
import { Config, mergeAttributes } from './config';
import marked from './customizedMarked';

function parseQuizdown(rawQuizdown: string, globalConfig: Config): Quiz {
    let tokens = tokenize(rawQuizdown);
    
    let activeQuestion: number;

    if (globalConfig.activeLineNumber){
        activeQuestion = findQuestionByLineNumber(tokens, globalConfig.activeLineNumber);
    }
    
    let quizConfig = new Config(globalConfig);
    if (activeQuestion >= 0) {
        quizConfig.activeQuestion = (activeQuestion);
    }
    if (hasQuizOptions(tokens)) {
        quizConfig = parseOptions(tokens, quizConfig);
    }
    let firstHeadingIdx = findFirstHeadingIdx(tokens);
    let questions = extractQuestions(tokens.slice(firstHeadingIdx), quizConfig);

    return new Quiz(questions, quizConfig);
}

function tokenize(rawQuizdown: string): marked.TokensList {
    return marked.lexer(htmlDecode(stripIndent(rawQuizdown)));
}

function findQuestionByLineNumber(tokens: marked.TokensList, lineNumber: number) {
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

function findFirstHeadingIdx(tokens: marked.Token[], startIndex: number = 0): number {
    for (let i = startIndex; i < tokens.length; i++) {
        if (tokens[i]['type'] == 'heading') {
            return i - startIndex; // Return relative index from the start index
        }
    }
    return -1; // No heading found
}


function parseOptions(tokens: marked.Token[], quizConfig: Config): Config {
    // type definition does not allow custom token types
    // @ts-ignore
    let options = tokens.find((token) => token.type == 'options');
    return mergeAttributes(quizConfig, options['data']);
}

function extractQuestions(tokens: marked.Token[], config: Config): BaseQuestion[] {
    let questions: BaseQuestion[] = [];
    let startIdx = 0;

    while (startIdx < tokens.length) {
        let relativeNextQuestionIdx = findFirstHeadingIdx(tokens, startIdx + 1);
        let nextQuestionIdx = relativeNextQuestionIdx !== -1 ? relativeNextQuestionIdx + startIdx + 1 : tokens.length;

        let currentTokens = tokens.slice(startIdx, nextQuestionIdx);
		let questionType = determineQuestionType(currentTokens);

        if (questionType != 'InvalidQuestion' && questionContainsList(currentTokens)) {
            let question = parseQuestion(currentTokens, config);
            questions.push(question);
        } else {
            if (config.activeLineNumber >= 0 && config.activeLineNumber >= (questions.length - 1)) {
                config.activeLineNumber -= 1;
            }
            console.log({"skipping question without any list": currentTokens});
        }
        startIdx = nextQuestionIdx; // Move start index forward to the next question's start or to the end of the array
    }
    return questions;
}

function questionContainsList(tokens: marked.Token[]): boolean {
    return tokens.some(token => token.type === 'list');
}

function parseQuestion(tokens: marked.Token[], config: Config): BaseQuestion {
    let explanation = parseExplanation(tokens);
    let hint = parseHint(tokens);
    let heading = parseHeading(tokens);
    let answers = parseAnswers(tokens);
    let questionType = determineQuestionType(tokens);
    let questionConfig = new Config(config);
    const args = [heading, explanation, hint, answers, questionConfig] as const;
    switch (questionType) {
        case 'SingleChoice':
            return new SingleChoice(...args);
        case 'MultipleChoice':
            return new MultipleChoice(...args);
        case 'Sequence':
            return new Sequence(...args);
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
    let list = tokens.find((token) => token.type == 'list') as marked.Tokens.List;
	if (!list || !(list as marked.Tokens.List).items.length) {
        // If there's no list or the list is empty, return 'Invalid' to indicate no valid question type
        return 'InvalidQuestion';
    }
    let checkedItems = list.items.filter(item => item.checked);
    let uncheckedItems = list.items.filter(item => !item.checked);

    if (list.ordered && !list.items.some(item => item.task)) {
        return 'Sequence';
    } else if (!list.ordered && !list.items.some(item => item.task)) {
		// Blanks
        return 'Sequence';
    } else if (checkedItems.length === 1) {
        return 'SingleChoice';
    } else if (checkedItems.length > 1) {
        return 'MultipleChoice';
    } else {
		// Not even one checkbox is crossed. This is not valid.
        return 'InvalidQuestion';
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
