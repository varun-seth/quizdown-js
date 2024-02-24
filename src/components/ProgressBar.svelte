<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { linear, cubicIn, cubicInOut } from 'svelte/easing';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';

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

    onMount(() => {
        updateProgress(value, max);
    });

    async function updateProgress(value: number, max: number) {
        let previousValue;
        lastValue.subscribe(($lastValue) => {
            previousValue = $lastValue;
        })();

        if (value == previousValue) {
            return;
        } else if (value > previousValue) {
            //
            if (value > 0) {
                await progress2.set(0, { duration: 100 });
            } else {
                progress2.set(1, { duration: 100 });
            }
            progress1.set(value + 1, { duration: 200 });
            if (value < max) {
                progress2.set(1 / (value + 1), { duration: 200 });
            }
        } else {
            if (value >= 0) {
                progress2.set(0, { duration: 100 });
            }
            await progress1.set(value + 1, { duration: 100 });
            progress2.set(1 / (value + 1), { duration: 200 });
        }

        lastValue.set(value);
    }

    $: if (value !== undefined && max !== undefined) {
        updateProgress(value, max);
    }

    $: progressPercent1 = String(($progress1 / max) * 100) + '%';
    $: progressPercent2 = String($progress2 * 100) + '%';
</script>

<div class="progress" data-label="">
    <div
        class="progress-slider {value < max - 1 ? 'progress-right-round' : ''}"
        style="width:{progressPercent1}"
    >
        <div
            class="progress-slider-inner {value > 0
                ? 'progress-left-round'
                : ''} progress-right-round"
            style="width:{progressPercent2}"
        ></div>
    </div>
</div>

<style>
    .progress {
        grid-area: auto;
        height: 0.4em;
        width: 100%;
        position: relative;
        display: flex;
        /* background-color: color-mix(in srgb, var(--quizdown-color-primary) 10%, white 90%); */
    }

    .progress .progress-slider {
        background-color: color-mix(
            in srgb,
            var(--quizdown-color-primary) 30%,
            white 70%
        );
        height: 100%;
        /* display: block; */
        display: flex;
        flex-direction: row-reverse;
    }

    .progress-right-round {
        /* border-top-right-radius: 5px; */
        border-bottom-right-radius: 5px;
    }
    .progress-left-round {
        /* border-top-left-radius: 5px; */
        border-bottom-left-radius: 5px;
    }
    .progress .progress-slider-inner {
        background-color: var(--quizdown-color-primary);
        /* background-color: white; */
        opacity: 1;
        height: 100%;
        display: block;
    }
</style>
