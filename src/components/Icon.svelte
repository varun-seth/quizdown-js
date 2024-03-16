<script lang="ts">
    import { onMount, beforeUpdate } from 'svelte';
    import { icon } from '@fortawesome/fontawesome-svg-core';
    import type {
        IconName,
        IconParams,
        IconLookup,
    } from '@fortawesome/fontawesome-svg-core';

    export let size:
        | 'xs'
        | 'lg'
        | 'sm'
        | '1x'
        | '2x'
        | '3x'
        | '4x'
        | '5x'
        | '6x'
        | '7x'
        | '8x'
        | '9x'
        | '10x' = '1x';
    export let spin = false;
    export let name: IconName;
    export let solid = true;

    let prefix = solid ? 'fas' : 'far';
    let html = '';

    $: params = {
        classes: [`fa-${size}`, spin ? 'fa-spin' : undefined],
    };

    $: prefix = solid ? 'fas' : 'far';

    $: if (name) {
        let iconObj = { prefix: prefix, iconName: name } as IconLookup;
        const result = icon(iconObj, params);
        if (result) {
            html = result.html[0];
        } else {
            console.warn('no name found: ' + name);
        }
    }

    // Dynamically adjust the CSS based on the size prop
    $: iconSizeStyle = `width: ${calculateSize(size)}rem; height: ${calculateSize(size)}rem;`;

    // Function to calculate size based on the 'size' prop
    function calculateSize(size) {
        switch (size) {
            case 'xs':
                return 0.75;
            case 'sm':
                return 0.875;
            case 'lg':
                return 1.33;
            case '2x':
                return 2;
            case '3x':
                return 3;
            // Add more cases as needed
            default:
                return 1; // Default to '1x' size
        }
    }
</script>

<div class="icon-container" style="{iconSizeStyle}">
    {@html html}
</div>

<style>
    .icon-container {
        display: inline-flex;
        line-height: 0; /* Removes extra space inside the container */
        justify-content: center;
        align-items: center;
    }
    .icon-container :global(svg) {
        width: 100%;
        height: 100%;
    }
</style>
