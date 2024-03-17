<script lang="ts">
    import DragDropList from './DragDropList.svelte';
    import type { BaseQuestion } from '../quiz';
    export let question: BaseQuestion;

    export let solved: boolean = false;

    $: {
        question.selected = question.answers.map((answer) => answer.id);
        question.saveState();
    }

    function sortAnswers(answers) {
        return [...answers].sort((a, b) => a.id - b.id);
    }
</script>

{#if !solved}
    <DragDropList bind:data="{question.answers}" />
{:else}
    <ol style="margin: 1rem;">
        {#each sortAnswers(question.answers) as answer}
            <li>
                {@html answer.html}
            </li>
        {/each}
    </ol>
{/if}
