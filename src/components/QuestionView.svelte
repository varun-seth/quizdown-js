<script lang="ts">
    import Button from './Button.svelte';
    import Icon from './Icon.svelte';
    import Hint from './Hint.svelte';
    import type { QuestionType, BaseQuestion } from '../quiz';

    import SequenceView from './SequenceView.svelte';
    import ChoiceView from './ChoiceView.svelte';
    import { _ } from 'svelte-i18n';

    export let question: BaseQuestion;

    $: showHint = question.showHint;

    // a mapping from quiz types to svelte components
    const componentMap: Record<QuestionType, any> = {
        Sequence: SequenceView,
        MultipleChoice: ChoiceView,
        SingleChoice: ChoiceView,
        NoChoiceQuestion: ChoiceView,
        Information: ChoiceView,
        InvalidQuestion: ChoiceView,
    };
</script>

<h3 style="text-align: center;">
    {@html question.text}
</h3>

{#if question.explanation}
    <p>{@html question.explanation}</p>
{/if}

{#if question.hint}
    <div style="display: inline-flex;">
        <Button
            size="large"
            title="{$_('hint')}"
            buttonAction="{question.toggleHint}"
            ><span
                style="color: {!$showHint
                    ? 'var(--quizdown-color-primary)'
                    : ''}"
            >
                <Icon name="lightbulb" />
            </span>
        </Button>
        <Hint hint="{question.hint}" show="{$showHint}" />
    </div>
{/if}

<svelte:component this="{componentMap[question.questionType]}" {question} />

<style>
    h3 {
        font-weight: normal;
    }
</style>
