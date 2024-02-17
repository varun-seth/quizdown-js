<script lang="ts">
    import type { Quiz } from '../quiz';
    import { beforeUpdate } from 'svelte';

    export let quiz: Quiz;
    let emojis = ['❌', '✅'];
    import { _ } from 'svelte-i18n';
    import { fade } from 'svelte/transition';
    import Icon from './Icon.svelte';
    import Loading from './Loading.svelte';
    import { get } from 'svelte/store';

    let waitTime = 800;
    if (get(quiz.isEvaluated)) {
        // only wait longer for the first time
        waitTime = 300;
    }
    let points = 0;
    beforeUpdate(() => (points = quiz.evaluate()));

    function format(n: number) {
        return n.toLocaleString('en-US', {
            minimumIntegerDigits: 2,
        });
    }
</script>

<h3 style="text-align: center;">{$_('resultsTitle')}</h3>
<Loading ms="{waitTime}" minHeight="{150}">
    <div in:fade="{{ duration: 1000 }}" class="results">
        <ol>
            {#each quiz.questions as question, i}
                <li class="top-list-item" on:click="{() => quiz.jump(i)}">
                    <span class="list-question">
                        {emojis[+question.solved]}
                        {@html question.text}
                    </span>
                    <ol>
                        <!-- answer comments when selected and available -->
                        {#each question.selected as selected}
                            {#if question.answers[selected].comment !== ''}
                                <li class="list-comment">
                                    <i
                                        >{@html question.answers[selected]
                                            .html}</i
                                    >:
                                    {@html question.answers[selected].comment}
                                </li>
                            {/if}
                        {/each}
                    </ol>
                </li>
            {/each}
        </ol>
		<div style="display: flex; flex-direction: column; align-items: center;">
			<div class="badge">
				{Math.round(100 * points / quiz.questions.length)}%
			</div>
			<h3>
				{format(points)} / {format(quiz.questions.length)}
			</h3>
		</div>
    </div>
</Loading>

<style>
    ol {
        padding-left: 0;
        display: inline-block;
    }

    .top-list-item {
        margin-bottom: 0.2rem;
        list-style-type: none;
        list-style: none;
    }

    .top-list-item:hover {
        cursor: pointer;
        background-color: var(--quizdown-color-secondary);
    }

    .top-list-item:hover .list-question {
        text-decoration: underline;
    }

    .list-comment {
        margin-left: 2em;
        list-style-type: initial;
    }

	.badge{
		display: flex;
		justify-content: center;
		align-items: center;
		height: 3em;
		width: 3em;
		border: 0.2em solid var(--quizdown-color-primary);
		font-size: 2em;
		border-radius: 50%;
	}

	.results {
		display: flex; 
		justify-content: space-around;
	}

	/* Smaller screens */
	@media (max-width: 600px) {
		.results {
			flex-direction: column-reverse;
		}
	}
	
</style>
