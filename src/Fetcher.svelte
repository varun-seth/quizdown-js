<script>
    // This will be replaced at build time with the actual value
    const apiKey = process.env.API_KEY;

    export function gdriveFetch(fileId, callbackFn) {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then((text) => {
                callbackFn(text);
            })
            .catch((error) => console.error('Error:', error));
    }
</script>
