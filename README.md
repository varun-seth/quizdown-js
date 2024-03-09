# QuizHub

> Markdownish syntax to instantly create simple interactive quizzes and share with anyone!

I'm working on this project in my free time to learn more about modern web development and languages. This is a toy project and should not be used in serious projects for now.

This project uses and extends an open source library called [quizdown-js](https://github.com/bonartm/quizdown-js). My contribution is mainly towards making this library easier to use for non-developers.

### 🚀 Try the [QuizHub live editor](https://quizhub.in/edit/)

- supports markdown text formatting, images, syntax highlighting and math rendering.
- different [quiz-types](./docs/syntax.md): single-choice, multiple-choice, sequence.
- support for [hints and explanations](./docs/syntax.md#hints-and-comments).
- [options](./docs/options.md) for color theme, question shuffling, localization.
- can be easily included in any website, static site generator or [other web projects](./docs/module_import.md).
- mobile friendly with touch support for all question types.

## Usage

QuizHub's internal library is easy to use in any project. Best used in combination with existing static site generators like *Jekyll*, *Hugo* or *Sphinx*. Check out the extensions
[hugo-quiz](https://github.com/bonartm/hugo-quiz) and [sphinxcontrib-quizdown](https://github.com/bonartm/sphinxcontrib-quizdown).

### 📚 [Documentation](./docs/)



## Stand-alone Example

Add the library to your website and initialize with default options:

```html
<head>
	...
    <script 
	src="https://cdn.jsdelivr.net/npm/quizdown@latest/public/build/quizdown.js">
	</script>
	<script>quizdown.init();</script>
	...
</head>
```

To keep the bundle size low, syntax highlighting and math rendering are implemented in separate extensions that can be loaded and registered manually if needed: 

```html
<head>
	...
    <script src="./build/quizdown.js"></script>
	<script src="./build/extensions/quizdownKatex.js"></script>
	<script src="./build/extensions/quizdownHighlight.js"></script>
	<script>
		quizdown.register(quizdownKatex).register(quizdownHighlight).init();
	</script>
	...
</head>
```

Write questions within a `quizdown` class (edit in the [🚀quizhub editor](https://quizhub.in/edit/)):

```html
...
<div class="quizdown">
	---
	primaryColor: steelblue
	shuffleQuestions: false
	shuffleAnswers: true
	---

	### Select your superpowers!

	- [ ] Enhanced Strength
	- [ ] Levitation
	- [x] Shapeshifting

	### What's the capital of Germany?

	> Hint: The _largest_ city in Germany...

	1. [x] Berlin
	2. [ ] Frankfurt
	3. [ ] Paris
	4. [ ] Cologne
</div>
...
```



## Contributing

Pull requests and feature requests are welcome. For major changes, please open an issue first to discuss what you would like to change. I'm happy for any feedback on how to improve the code base. 

### Wish List

- support for videos via youtube api (https://github.com/bonartm/quizdown-js/issues/10)
- customizable reward page at the end of the quiz (https://github.com/bonartm/quizdown-js/issues/14)
- fill in the blanks quiz (https://github.com/bonartm/quizdown-js/issues/17)
- link quizzes on different pages together via a results summary page (https://github.com/bonartm/quizdown-js/issues/18)

### How To

After cloning, install the packages with 

```bash
npm install
```

Build the library with

```bash
npm run build
```

You can also preview a live version with

```bash
npm run dev
```


## Credits
Built on top of the incredible [quizdown-js](https://github.com/bonartm/quizdown-js)

Inspired by the [mermaid library](https://mermaid-js.github.io/mermaid/#/) and the python package [quizdown](https://github.com/jjfiv/quizdown).
