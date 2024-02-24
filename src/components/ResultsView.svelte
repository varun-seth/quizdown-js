<script lang="ts">
    import type { Quiz } from '../quiz';
    import { beforeUpdate } from 'svelte';

    export let quiz: Quiz;
    import { _ } from 'svelte-i18n';
    import { fade } from 'svelte/transition';
    import Icon from './Icon.svelte';
    import Loading from './Loading.svelte';
    import { get } from 'svelte/store';

    let points = 0;
    beforeUpdate(() => (points = quiz.evaluate()));

    function format(n: number) {
        return n.toLocaleString('en-US', {
            minimumIntegerDigits: 1,
        });
    }
</script>

<h3 style="text-align: center;">{$_('resultsTitle')}</h3>
<div class="results-container">
	<div class="scores">
		<div class="badge">
			{Math.round(100 * points / quiz.questions.length)}%
		</div>
		<h4 style="text-wrap: nowrap;">
			{$_('score')} : {points} / {format(quiz.questions.length)}
		</h4>
	</div>
    <div in:fade="{{ duration: 1000 }}" class="results">
        <ol>
            {#each quiz.questions as question, i}
                <li class="top-list-item" on:click="{() => quiz.jump(i)}">
                    <span class="list-question">
						<span style="padding: 5px; color: {question.solved ? '#16cc16': '#ff3131'}">
						<Icon name="{question.solved ? 'circle-check' : 'circle-xmark'}"></Icon>
						</span>
						<span style="padding: 5px;">
							{@html question.text}
						</span>
                    </span>
                    <span class="list-answer-comment">
                        <!-- answer comments when selected and available -->
                        {#each question.selected as selected}
                            {#if question.answers[selected].comment !== ''}
                                <li class="list-comment">
                                    {@html question.answers[selected].html}
									<br>
                                    {@html question.answers[selected].comment}
                                </li>
                            {/if}
                        {/each}
                    </span>
                </li>
            {/each}
        </ol>
    </div>
</div>

<style>
    ol {
        padding-left: 0;
        display: inline-block;
    }

    .top-list-item {
        list-style-type: none;
        list-style: none;
    }

    .top-list-item:hover {
        cursor: pointer;
        background-color: var(--quizdown-color-secondary);
    }

	.list-question{
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding-left: 5px;
		padding-right: 5px;
	}

	.top-list-item{
		border-radius: 5px;
	}

    .top-list-item:hover, .top-list-item:focus {
        text-decoration: none;
		background: rgb(0, 0, 0, 0.05);
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
		border: 0.15em solid var(--quizdown-color-primary);
		font-size: 2em;
		border-radius: 50%;
	}

	.results-container {
		display: flex; 
		flex-direction: row-reverse; 
		align-items: flex-start; 
		justify-content: space-evenly;
	}
	.scores {
		display: flex; 
		flex-direction: column; 
		align-items: center; 
		justify-content: space-evenly;
		margin-top: 20px;
	}

	.results {
		display: flex; 
		justify-content: space-around;
	}

	/* Smaller screens */
	@media (max-width: 600px) {
		.results-container {
			flex-direction: column;
			align-items: center;
		}
		.scores {
			margin-top: 0;
		}
	}
	
</style>
