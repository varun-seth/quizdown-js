<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { linear, cubicIn, cubicInOut  } from 'svelte/easing';
	import { writable } from 'svelte/store';

    export let value: number;
    export let max: number;

    const progress1 = tweened(0, {
        duration: 150,
        easing: linear,
    });
    const progress2 = tweened(1, {
        duration: 150,
        easing: linear,
    });
	const lastValue = writable(value);

    async function updateProgress(value: number, max: number, ) {
		let previousValue;
		lastValue.subscribe(($lastValue) => {
			previousValue = $lastValue;
		})();

		if (value >= previousValue) {
			await progress2.set(0, {duration: 100}); 
			progress1.set(value + 1, {duration: 200});
			if (value < max){
				await progress2.set(1/(value + 1), {duration: 200});
			}
		} else {
			progress2.set(0, {duration: 100});
			await progress1.set(value + 1, {duration: 100});
			progress2.set(1/(value + 1), {duration: 200});
		}

		lastValue.set(value);
    }

    $: if (value !== undefined && max !== undefined) {
        updateProgress(value, max);
    }

    $: progressPercent1 = String(($progress1 / (max)) * 100) + '%';
	$: progressPercent2 = String(($progress2) * 100) + '%';
</script>

<div class="progress" data-label="">
    <div class="progress-slider" style="width:{progressPercent1}">
		<div class="progress-slider-inner" style="width:{progressPercent2}"></div>
	</div>
    
</div>

<style>
    .progress {
        grid-area: auto;
        height: 0.4em;
        width: 100%;
        position: relative;
		display: flex;
    }

    .progress .progress-slider {
        background-color: var(--quizdown-color-secondary);
        height: 100%;
        /* display: block; */
		display: flex;
		flex-direction: row-reverse;
    }
    .progress .progress-slider-inner{
        background-color: var(--quizdown-color-primary);
		/* background-color: white; */
		opacity: 1;
        height: 100%;
        display: block;
    }
</style>
