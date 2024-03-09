<script lang="ts">
    import { fade } from 'svelte/transition';
    export let show: Boolean;
    export let hint: string;
</script>

{#if show}
    <span
        style="display: flex"
        in:fade|local="{{ duration: 400 }}"
        class="hint"
    >
        {@html hint}
    </span>
{/if}

<style>
    :global(.hint > p) {
        margin: auto;
    }
</style>
