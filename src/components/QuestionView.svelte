<script lang="ts">
    import Button from './Button.svelte';
    import Icon from './Icon.svelte';
    import Hint from './Hint.svelte';
    import type { QuestionType, BaseQuestion } from '../quiz';
    import type { SvelteComponent } from 'svelte';

    import SequenceView from './SequenceView.svelte';
    import ChoiceView from './ChoiceView.svelte';
    import { _ } from 'svelte-i18n';

    export let question: BaseQuestion;

    $: showHint = question.showHint;

    // a mapping from quiz types to svelte components
    let componentMap: Record<QuestionType, typeof SvelteComponent> = {
        Sequence: SequenceView,
        MultipleChoice: ChoiceView,
        SingleChoice: ChoiceView,
    };
</script>

<h3 style="text-align: center;">
    {@html question.text}
</h3>

{#if question.explanation}
    <p>{@html question.explanation}</p>
{/if}

{#if question.hint}
    <div>
        <Button title="{$_('hint')}" buttonAction="{question.toggleHint}"
            ><span
                style="color: {$showHint
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
