<script lang="ts">
    import type { Quiz } from './quiz';
    import ProgressBar from './components/ProgressBar.svelte';
    import { onMount } from 'svelte';
    import registerLanguages from './languages/i18n';
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
    import Solution from './components/Solution.svelte';

    export let quiz: Quiz;
    // https://github.com/sveltejs/svelte/issues/4079
    $: question = quiz.active;
    $: index = quiz.index;
    $: onLast = quiz.onLast;
    $: onFirst = quiz.onFirst;
    $: onIntro = quiz.onIntro;
    $: onSolutions = quiz.onSolutions;
    $: onResults = quiz.onResults;
    $: isEvaluated = quiz.isEvaluated;
    $: isStarted = quiz.isStarted;
    $: allVisited = quiz.allVisited;

    let points: number;

    beforeUpdate(() => {
        points = quiz.pointsTotal();
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

        document.documentElement.style.setProperty(
            '--quizdown-color-primary',
            primaryColor
        );
        document.documentElement.style.setProperty(
            '--quizdown-color-secondary',
            secondaryColor
        );
        document.documentElement.style.setProperty(
            '--quizdown-color-text',
            textColor
        );
        node.style.minHeight = `${minHeight}px`;
    });
</script>

{#if !$onSolutions}
    <ProgressBar value="{$index}" max="{quiz.questions.length}" />
{/if}

<div
    class="quizdown-content {$onSolutions ? 'quizdown-content-solutions' : ''}"
    bind:this="{node}"
>
    {#if $onIntro}
        <Container additionalClasses="intro-page">
            <a href="/" title="home">
                <Button title="home" size="large">
                    <span style="color: var(--quizdown-color-primary)">
                        <Icon name="lightbulb" size="2x"></Icon>
                    </span>
                </Button>
            </a>
            <span style="">
                <h1 style="text-align: center;">
                    {quiz.config.title || 'Welcome to the Quiz'}
                </h1>
                {#if quiz.config.description}
                    <p>{@html quiz.config.description}</p>
                {/if}
            </span>
            <div>
                {$_('count')}: {quiz.questions.length}
                <br />
                {$_('points')}: {points}
            </div>

            {#if quiz.config.authorName}
                <div
                    style="display: inline-flex; flex-direction: column; align-items: center"
                >
                    {#if quiz.config.authorImageUrl}
                        <a
                            href="{quiz.config.authorUrl || null}"
                            target="{quiz.config.authorUrl ? '_blank' : null}"
                        >
                            <img
                                class="author-image"
                                alt="{quiz.config.authorName || 'Author Image'}"
                                src="{quiz.config.authorImageUrl}"
                            />
                        </a>
                    {/if}
                    {#if quiz.config.authorUrl}
                        <a href="{quiz.config.authorUrl}" target="_blank">
                            {quiz.config.authorName}
                        </a>
                    {/if}
                    {#if !quiz.config.authorUrl && quiz.config.authorName}
                        {quiz.config.authorName}
                    {/if}
                </div>
            {/if}

            <span style="margin-top: 2em; margin-bottom: 2em;">
                <Button
                    size="large"
                    title="Start"
                    buttonAction="{() => quiz.jump(0)}"
                    color="primary"
                >
                    <Icon name="play"></Icon>
                    {$_('start')}
                </Button>
            </span>
        </Container>
    {:else if $onSolutions}
        <div class="solutions-container">
            <Solution {quiz}></Solution>
        </div>
        <!-- back button -->
        <span class="floating-button">
            <Button
                size="large"
                color="primary"
                title="{$_('resultsTitle')}"
                buttonAction="{() => {
                    quiz.toggleSolutions();
                }}"
                ><Icon name="arrow-left" size="lg" />
            </Button>
        </span>
    {:else}
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
                size="large"
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
                {#if $isStarted && !$onResults}
                    <Button
                        size="large"
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
                        size="large"
                        disabled="{$onResults || (!$isEvaluated && $onLast)}"
                        buttonAction="{quiz.next}"
                        title="{$_('next')}"
                        ><Icon name="arrow-right" size="lg" /></Button
                    >
                {/if}
            </svelte:fragment>

            <Button
                size="large"
                color="{$onLast && !$isEvaluated ? 'primary' : ''}"
                slot="right"
                disabled="{$onIntro}"
                title="{!$onResults ? $_('evaluate') : $_('solution')}"
                buttonAction="{() => {
                    if (!$onResults) {
                        quiz.jump(quiz.questions.length);
                    } else {
                        quiz.toggleSolutions();
                    }
                }}"
                ><Icon
                    name="{!$onResults ? 'clipboard-check' : 'clipboard-list'}"
                    size="lg"
                />
                <span
                    class="hidden {($onLast && !$isEvaluated) || $onResults
                        ? 'spawned'
                        : ''}"
                >
                    {!$onResults ? $_('evaluate') : $_('solution')}
                </span>
            </Button>
        </Row>
    {/if}
</div>

<!-- global styles applied to all elements in the app -->
<style type="text/scss" global>
    @import 'highlight.js/styles/github';
    @import 'katex/dist/katex';
    @import '@fortawesome/fontawesome-svg-core/styles';

    .hidden {
        position: absolute;
        display: inline-block;
        overflow: hidden;
        max-width: 0;
        transition: max-width 0.5s ease;
        visibility: hidden;
    }

    .spawned {
        position: inherit;
        /* padding required for hindi */
        padding-top: 2px;
        padding-bottom: 2px;
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
        height: calc(100% - 40px - 0.4em);
        width: calc(100% - 40px);
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        padding: 20px;
        max-width: 800px;
    }

    .quizdown-content-solutions {
        max-width: unset;
        padding: 0px;
        margin: 0px;
        align-items: center;
        height: 100%;
        width: 100%;
        overflow: auto;
    }

    .solutions-container {
        padding: 20px;
        max-width: 800px;
        position: relative;
    }
    .floating-button {
        position: absolute;
        bottom: 20px;
        right: 20px;
    }

    /* Smaller screens */
    @media (max-width: 600px) {
        .quizdown-content {
            padding: 0;
            margin: 0;
            height: calc(100% - 0.4em);
            width: 100%;
        }

        .floating-button {
            bottom: 0px;
            right: 0px;
        }
    }

    .author-image {
        height: 64px;
        width: 64px;
        border-radius: 50%;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    }

    .intro-page {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
    }

    h1 {
        font-weight: normal;
    }

    pre {
        margin: 0.3em 0;
    }
</style>
