<script lang="ts">
    import type { Quiz } from './quiz';
    import ProgressBar from './components/ProgressBar.svelte';
    import { onMount } from 'svelte';
    import registerLanguages from './languages/i18n';
    import Card from './components/Card.svelte';
    import Credits from './components/Credits.svelte';
    import SmoothResize from './components/SmoothResize.svelte';
    import QuestionView from './components/QuestionView.svelte';
    import Row from './components/Row.svelte';
    import Button from './components/Button.svelte';
    import { _ } from 'svelte-i18n';
    import ResultsView from './components/ResultsView.svelte';
    // import { Linear, CheckFirst } from './progressModes.js';
    import Animated from './components/Animated.svelte';
    import registerIcons from './registerIcons.js';
    import Icon from './components/Icon.svelte';
    import { fly } from 'svelte/transition';
    import Container from './components/Container.svelte';
    import Loading from './components/Loading.svelte';
    // import Modal from './components/Modal.svelte';
    import { fade } from 'svelte/transition';
    import { beforeUpdate } from 'svelte';

    export let quiz: Quiz;
    // https://github.com/sveltejs/svelte/issues/4079
    $: question = quiz.active;
    $: index = quiz.index;
    $: onLast = quiz.onLast;
    $: onFirst = quiz.onFirst;
    $: onIntro = quiz.onIntro;
    $: onResults = quiz.onResults;
    $: isEvaluated = quiz.isEvaluated;
    $: isStarted = quiz.isStarted;
    $: allVisited = quiz.allVisited;

    let maxScore: number;

    beforeUpdate(() => {
        maxScore = quiz.maxScoreTotal();
    });

    //let game = new Linear(quiz);

    registerLanguages(quiz.config.locale);
    registerIcons();

    let node: HTMLElement;
    let minHeight = 150;
    // let showModal = false;

    // set global options
    onMount(async () => {
        let primaryColor: string = quiz.config.primaryColor;
        let secondaryColor: string = quiz.config.secondaryColor;
        let textColor: string = quiz.config.textColor;

        node.style.setProperty('--quizdown-color-primary', primaryColor);
        node.style.setProperty('--quizdown-color-secondary', secondaryColor);
        node.style.setProperty('--quizdown-color-text', textColor);
        node.style.minHeight = `${minHeight}px`;
    });
</script>

<div class="quizdown-content" bind:this="{node}">
    <Card>
        <ProgressBar value="{$index}" max="{quiz.questions.length}" />
        {#if $onIntro}
            <div class="intro-page" style="text-align: center;">
                <span>
                    <h1>Welcome to the Quiz</h1>
                    {#if quiz.config.description}
                        <div>{quiz.config.description}</div>
                    {/if}
                </span>
                <div>
                    Count: {quiz.questions.length}
                    <br />
                    Score: {maxScore}
                </div>

                {#if quiz.config.authorName}
                    <div style="display: inline-flex; flex-direction: column;">
                        <span style="color: gray">Author</span>
                        <a href="{quiz.config.authorUrl}">
                            <img
                                class="author-image"
                                alt="{quiz.config.authorName}"
                                src="{quiz.config.authorImageUrl}"
                            />
                        </a>
                        <a href="{quiz.config.authorUrl}">
                            {quiz.config.authorName}
                        </a>
                    </div>
                {/if}

                <Button
                    title="Start"
                    buttonAction="{() => quiz.jump(0)}"
                    color="primary"
                >
                    <Icon name="play"></Icon>
                    {$_('start')}
                </Button>
            </div>
        {/if}
        {#if !$onIntro}
            <Container>
                <SmoothResize {minHeight}>
                    <Animated update="{$index}">
                        {#if $onResults}
                            <ResultsView {quiz} />
                        {:else if !$onIntro}
                            <QuestionView question="{$question}" />
                        {/if}
                    </Animated>
                </SmoothResize>

                <!-- <Modal show="{showModal}">Are you sure?</Modal> -->
            </Container>

            <Row>
                <Button
                    disabled="{!$isStarted}"
                    slot="left"
                    title="{$_('reset')}"
                    buttonAction="{() => {
                        quiz.reset();
                    }}"
                >
                    <Icon name="redo" />
                    <span class="hidden {$onResults ? 'spawned' : ''}">
                        {$_('reset')}
                    </span>
                </Button>
                <svelte:fragment slot="center">
                    {#if $isStarted}
                        <Button
                            title="{$_('previous')}"
                            disabled="{$onIntro || $onFirst}"
                            buttonAction="{quiz.previous}"
                            ><Icon name="arrow-left" size="lg" /></Button
                        >
                        <span
                            style="display: flex; align-items: center; text-wrap: nowrap; visibility: {$onIntro ||
                            $onResults
                                ? 'hidden'
                                : ''}; "
                        >
                            {$index + 1}
                            /
                            {quiz.questions.length}
                        </span>

                        <Button
                            disabled="{$onResults ||
                                (!$isEvaluated && $onLast)}"
                            buttonAction="{quiz.next}"
                            title="{$_('next')}"
                            ><Icon name="arrow-right" size="lg" /></Button
                        >
                    {/if}
                </svelte:fragment>

                <Button
                    color="{$onLast && !$isEvaluated ? 'primary' : ''}"
                    slot="right"
                    disabled="{$onResults || $onIntro}"
                    title="{$_('evaluate')}"
                    buttonAction="{() => quiz.jump(quiz.questions.length)}"
                    ><Icon name="check-double" size="lg" />
                    <span
                        class="hidden {$onLast && !$isEvaluated
                            ? 'spawned'
                            : ''}"
                    >
                        {$_('evaluate')}
                    </span>
                </Button>
            </Row>
        {/if}
    </Card>
</div>

<!-- global styles applied to all elements in the app -->
<style type="text/scss" global>
    @import 'highlight.js/styles/github';
    @import 'katex/dist/katex';
    @import '@fortawesome/fontawesome-svg-core/styles';

    .hidden {
        display: inline-block;
        overflow: hidden;
        max-width: 0;
        transition: max-width 0.5s ease;
        visibility: hidden;
    }

    .spawned {
        max-width: 100px;
        visibility: visible;
    }
    img {
        max-height: 400px;
        border-radius: 4px;
        max-width: 100%;
        height: auto;
    }

    code {
        padding: 0 0.4rem;
        font-size: 85%;
        color: #333;
        white-space: pre-wrap;
        border-radius: 4px;
        padding: 0.2em 0.4em;
        background-color: #f8f8f8;
        font-family: Consolas, Monaco, monospace;
    }

    a {
        color: var(--quizdown-color-primary);
    }

    .quizdown-content {
        padding: 0;
        max-width: 800px;
        height: 100%;
        margin: auto;
    }
    /* Smaller screens */
    @media (max-width: 600px) {
        .quizdown-content {
            padding: 0;
            margin: 0;
        }
    }

    .author-image {
        height: 100px;
        width: 100px;
        border-radius: 50%;
        border: 2px solid gray;
    }

    .intro-page {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
    }
</style>
