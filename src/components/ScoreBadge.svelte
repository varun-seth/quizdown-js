<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    export let fraction: number; // floating number from 0 to 1

    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    // Tweened store to animate the percentage
    const percent = tweened(0, {
        duration: 1000, // Duration of the animation in milliseconds
        easing: cubicOut, // Easing function
    });

    // Calculate stroke-dashoffset based on the current percentage
    $: offset = $percent
        ? circumference - ($percent / 100) * circumference
        : circumference;
    $: if (fraction !== undefined) {
        const calculatedPercent = fraction * 100;
        percent.set(calculatedPercent);
    }
</script>

<svg width="120px" height="120px" viewBox="0 0 100 100">
    <circle
        cx="50"
        cy="50"
        r="45"
        stroke="color-mix(in srgb, var(--quizdown-color-primary) 10%, white 90%)"
        stroke-width="6"
        fill="transparent"
    ></circle>
    <circle
        cx="50"
        cy="50"
        r="45"
        stroke="var(--quizdown-color-primary)"
        stroke-width="5"
        fill="none"
        style="transform: rotate(-90deg); transform-origin: 50% 50%;"
        stroke-dasharray="{circumference}"
        stroke-dashoffset="{offset}"
        stroke-linecap="round"
    ></circle>
    <!-- The text remains static -->
    <text
        x="50%"
        y="50%"
        text-anchor="middle"
		dominant-baseline="middle"
		font-size="1.5em"
        fill="var(--quizdown-color-primary)"
    >
        {Math.round(100 * fraction)}%
    </text>
</svg>

<style>
</style>
