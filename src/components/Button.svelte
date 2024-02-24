<script lang="ts">
    export let buttonAction = () => {};
    export let disabled = false;
    export let title = '';
	export let color = '';

    // Reactive statement to dynamically set classes based on `color` value
    $: primaryClass = (color == 'primary');
</script>

<button
    class:primary={primaryClass}
    title="{title}"
    disabled="{disabled}"
    on:click="{buttonAction}">
    <slot />
</button>

<style>
    button:disabled {
        background-color: white;
        filter: grayscale(100%);
        color: gray;
        cursor: initial;
        opacity: 50%;
    }

    button {
        background-color: white;
        color: var(--quizdown-color-text);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: 1px solid transparent;
        line-height: 1;
        text-align: center;
        transition: opacity 0.2s ease;
        text-decoration: none;
        cursor: pointer;
        margin: 0.2rem;
        font-size: 1em;
		display: inline-flex;
		gap: 8px;
		align-items: center;
    }

    .primary {
        background-color: var(--quizdown-color-primary);
        color: white;
    }

    button:hover:not(:checked):not(:active):not(:disabled) {
		/*reducing brightness also impacts colored icons*/
		/*replacing background-color instead*/
        background-color: rgb(0, 0,0, 0.1);

    }

	button:hover:not(:checked):not(:active):not(:disabled).primary {
		filter: brightness(110%);
        background-color: var(--quizdown-color-primary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: filter 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
    }
</style>
