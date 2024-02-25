<script lang="ts">
    import type { BaseQuestion } from '../quiz';
    export let question: BaseQuestion;
    import Icon from './Icon.svelte';
    let checked = {};

    $: {
        checked = {};
        if (question.questionType === 'MultipleChoice') {
            question.selected.forEach((s) => {
                checked[s] = true;
            });
        } else {
            // For single choice, ensure only one can be checked
            const selectedValue = question.selected.length
                ? question.selected[0]
                : null;
            if (selectedValue !== null) {
                checked[selectedValue] = true;
            }
        }
    }
</script>

<fieldset>
    {#if question.questionType === 'MultipleChoice'}
        {#each question.answers as answer, i}
            <label style="position: relative">
                <input
                    type="checkbox"
                    bind:group="{question.selected}"
                    value="{i}"
                />
                <span class="my-choice">
                    <span
                        class="my-choice-marker"
                        style="color: {checked[i]
                            ? 'var(--quizdown-color-primary)'
                            : ''}"
                    >
                        {#if checked[i]}
                            <Icon name="check-square"></Icon>
                        {/if}
                        {#if !checked[i]}
                            <Icon name="square" solid="{false}"></Icon>
                        {/if}
                    </span>
                    {@html answer.html}
                </span>
            </label>
        {/each}
    {:else}
        {#each question.answers as answer, i}
            <label style="position: relative">
                <input
                    type="radio"
                    bind:group="{question.selected[0]}"
                    value="{i}"
                />
                <span class="my-choice">
                    <span
                        class="my-choice-marker"
                        style="color: {checked[i]
                            ? 'var(--quizdown-color-primary)'
                            : ''}"
                    >
                        {#if checked[i]}
                            <Icon name="dot-circle" solid="{true}"></Icon>
                        {/if}
                        {#if !checked[i]}
                            <Icon name="circle" solid="{false}"></Icon>
                        {/if}
                    </span>
                    {@html answer.html}
                </span>
            </label>
        {/each}
    {/if}
</fieldset>

<style>
    fieldset {
        border: 0;
    }

    [type='checkbox'],
    [type='radio'] {
        position: absolute;
        opacity: 0;
    }

    [type='radio'] + span {
        border-radius: 0.5em;
    }

    [type='checkbox'] + span {
        border-radius: 2px;
    }

    [type='checkbox'] + span,
    [type='radio'] + span {
        transition-duration: 0.3s;
        color: var(--quizdown-color-text);
        display: block;
        padding: 0.5rem;
        margin: 5px;
        border: 3px solid transparent;
        cursor: pointer;
    }

    [type='checkbox']:hover + span,
    [type='checkbox']:focus + span,
    [type='radio']:hover + span,
    [type='radio']:focus + span {
        border: 3px dashed
            color-mix(in srgb, var(--quizdown-color-primary) 30%, white 70%);
    }

    [type='checkbox']:checked + span,
    [type='radio']:checked + span {
        border: 3px solid var(--quizdown-color-primary);
    }

    .my-choice {
        padding-left: 2em !important;
    }
    .my-choice-marker {
        position: absolute;
        left: 1em;
    }
    :global(.my-choice p) {
        margin-block-start: 0;
        margin-block-end: 0;
    }
</style>
