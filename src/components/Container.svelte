<div class="container">
    <slot />
</div>

<style>
    .container {
        padding: 2px 16px;
        display: grid;
        align-items: start;
        overflow: auto;
		height: calc(100vh - 100px);
    }
</style>
