<script lang="ts">
    import { fade } from 'svelte/transition';
    import Button from './Button.svelte';
    import Icon from './Icon.svelte';
    export let show: Boolean;
    export let disabled: boolean = false;
    export let hint: string;

    export let buttonAction = () => {};
    import { _ } from 'svelte-i18n';
</script>

<div style="display: inline-flex;">
    <Button {disabled} size="large" title="{$_('hint')}" {buttonAction}
        ><span style="color: {!show ? 'var(--quizdown-color-primary)' : ''}">
            <Icon name="lightbulb" />
        </span>
    </Button>
    {#if show}
        <span
            style="display: flex"
            in:fade|local="{{ duration: 400 }}"
            class="hint"
        >
            {@html hint}
        </span>
    {/if}
</div>

<style>
    :global(.hint > p) {
        margin: auto;
    }
</style>
