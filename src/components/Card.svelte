<div class="card">
    <slot />
</div>

<style>
    .card {
        /* box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
        border-radius: 0 0 4px 4px; */
        display: flex;
        flex-direction: column;
        height: calc(100% - 0.4em);
        margin: auto;
        max-width: 1200px;
        overflow: hidden;
        box-shadow: none;
    }

    /* Responsive margin */
    @media (min-width: 600px) {
        .card {
            margin: 20px;
            height: calc(100% - 40px - 0.4em);
            border-radius: 5px;
        }
    }
</style>
