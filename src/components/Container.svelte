<script>
    export let additionalClasses = '';
</script>

<div class="container {additionalClasses}">
    <slot />
</div>

<style>
    .container {
        padding: 2px 16px;
        flex-grow: 1;
        overflow-y: auto;
    }
</style>
