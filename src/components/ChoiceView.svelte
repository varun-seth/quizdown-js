<script lang="ts">
    import type { BaseQuestion } from '../quiz';
    export let question: BaseQuestion;
    import Icon from './Icon.svelte';
    let checked = {};

    // Function to handle checkbox changes
    function handleCheckboxChange(i) {
        if (question.questionType === 'SingleChoice') {
            // Clear all selections for SingleChoice questions
            question.selected = question.selected[0] === i ? [] : [i];
        } else {
            // Toggle selection for MultipleChoice questions
            const index = question.selected.indexOf(i);
            if (index > -1) {
                question.selected.splice(index, 1); // Remove if exists
            } else {
                question.selected.push(i); // Add if not exists
            }
        }
    }

    // Watch for changes in selection to update the checked state
    $: {
        checked = {};
        question.selected.forEach((s) => {
            checked[s] = true;
        });
    }
</script>

<fieldset>
    {#each question.answers as answer, i}
        <label style="position: relative">
            <input
                type="checkbox"
                bind:checked="{checked[i]}"
                on:click="{() => handleCheckboxChange(i)}"
            />
            <span
                class="my-choice {question.questionType === 'SingleChoice'
                    ? 'my-choice-single'
                    : 'my-choice-multi'}"
            >
                <span
                    class="my-choice-marker"
                    style="color: {checked[i]
                        ? 'var(--quizdown-color-primary)'
                        : ''}"
                >
                    {#if question.questionType === 'SingleChoice'}
                        {#if checked[i]}
                            <Icon name="dot-circle" solid="{true}"></Icon>
                        {:else}
                            <Icon name="circle" solid="{false}"></Icon>
                        {/if}
                    {:else if checked[i]}
                        <Icon name="check-square"></Icon>
                    {:else}
                        <Icon name="square" solid="{false}"></Icon>
                    {/if}
                </span>
                {@html answer.html}
            </span>
        </label>
    {/each}
</fieldset>

<style>
    fieldset {
        border: 0;
    }

    [type='checkbox'] {
        position: absolute;
        opacity: 0;
    }

    [type='checkbox'] + span {
        color: var(--quizdown-color-text);
        display: block;
        padding: 0.5rem;
        margin: 5px;
        border: 3px solid transparent;
        cursor: pointer;
    }

    [type='checkbox']:hover + span,
    [type='checkbox']:focus + span {
        border: 3px solid
            color-mix(in srgb, var(--quizdown-color-primary) 30%, white 70%);
    }

    [type='checkbox']:not(:hover) + span .my-choice-marker,
    [type='checkbox']:not(:focus) + span .my-choice-marker {
        color: gray;
    }

    [type='checkbox']:hover + span .my-choice-marker,
    [type='checkbox']:focus + span .my-choice-marker {
        color: var(--quizdown-color-primary);
    }

    [type='checkbox']:checked + span {
        border: 3px solid var(--quizdown-color-primary);
    }

    .my-choice {
        padding-left: 2.4rem !important;
        position: relative;
    }

    .my-choice-single {
        border-radius: 2rem;
    }
    .my-choice-multi {
        border-radius: 0.2rem;
    }
    .my-choice-marker {
        position: absolute;
        left: 0.8rem;
        top: 50%;
        transform: translateY(-50%);
    }
    :global(.my-choice p) {
        margin-block-start: 0;
        margin-block-end: 0;
    }
</style>
