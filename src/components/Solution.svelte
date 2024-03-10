<script lang="ts">
    import type { Quiz } from '../quiz';

    export let quiz: Quiz;
    import { _ } from 'svelte-i18n';
    import { fade } from 'svelte/transition';
    import SequenceView from './SequenceView.svelte';
    import ChoiceView from './ChoiceView.svelte';
    import Hint from './Hint.svelte';
</script>

<h2 style="text-align: center;">
    {quiz.config.title || 'Quiz'}
    {$_('solution')}
</h2>
<div in:fade="{{ duration: 1000 }}" class="solution-container">
    {#each quiz.questions as question, i}
        <div>
            <div class="question-heading">
                {$_('questionLetter')}{i + 1}.
                {@html question.text}
            </div>

            {#if question.explanation}
                <div>{@html question.explanation}</div>
            {/if}

            {#if question.hint}
                <Hint hint="{question.hint}" show="{true}" disabled="{true}" />
            {/if}

            {#if question.questionType === 'Sequence'}
                <SequenceView {question} solved="{true}" />
            {:else}
                <ChoiceView {question} solved="{true}" />
            {/if}
        </div>
    {/each}
</div>

<style>
    h2,
    h3 {
        font-weight: normal;
    }

    .question-heading {
        /* relative-position is necessary to prevent scrollbar due to height increases in the body. */
        position: relative;
        font-size: 1.17em;
        font-weight: normal;
    }

    .solution-container {
        display: grid;
        grid-gap: 20px;
    }
</style>
