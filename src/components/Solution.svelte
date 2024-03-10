<script lang="ts">
    import type { Quiz } from '../quiz';

    export let quiz: Quiz;
    import { _ } from 'svelte-i18n';
    import { fade } from 'svelte/transition';
    import SequenceView from './SequenceView.svelte';
    import ChoiceView from './ChoiceView.svelte';
</script>

<h2 style="text-align: center;">{$_('solution')}</h2>
<div class="solution-container">
    <div in:fade="{{ duration: 1000 }}" class="solution">
        {#each quiz.questions.filter((q) => {
            return q.points > 0;
        }) as question, i}
            <div>
                <div class="question-heading">
                    {$_('questionLetter')}{i + 1}.
                    {@html question.text}
                </div>

                {#if question.explanation}
                    <div>{@html question.explanation}</div>
                {/if}

                {#if question.questionType === 'MultipleChoice' || question.questionType === 'SingleChoice'}
                    <ChoiceView {question} solved="{true}" />
                {:else if question.questionType === 'Sequence'}
                    <SequenceView {question} solved="{true}" />
                {/if}
            </div>
        {/each}
    </div>
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
</style>
