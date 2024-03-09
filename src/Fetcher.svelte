<script>
    // This will be replaced at build time with the actual value
    const apiKey = process.env.API_KEY;
    export function gdriveFetch(fileId, callbackFn) {
        const metadataUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=owners,name,description&key=${apiKey}`;
        const contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;

        // Fetch file metadata
        fetch(metadataUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch metadata');
                }
                return response.json();
            })
            .then((metadata) => {
                // Extract parameters from metadata
                const params = {};
                let newName = metadata.name;

                if (newName) {
                    if (newName.endsWith('.md')) {
                        // Remove the last 3 characters (".md") from the string
                        newName = newName.slice(0, -3);
                    }
                    params['title'] = newName;
                }
                if (metadata.description) {
                    params['description'] = metadata.description;
                }
                if (metadata.owners && metadata.owners.length > 0) {
                    if (metadata.owners.length > 1) {
                        console.warn(
                            'We only support a single owner currently'
                        );
                    }
                    const owner = metadata.owners[0];
                    params.authorName = owner.displayName;
                    // Note: photoLink might not always be present
                    params.authorImageUrl =
                        owner.photoLink || 'defaultImageUrl';
                    params.authorUrl = 'mailto:' + owner.emailAddress;
                }

                // Fetch file content
                fetch(contentUrl)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch file content');
                        }
                        return response.text();
                    })
                    .then((text) => {
                        // Call callback with content and parameters
                        callbackFn(text, params);
                    });
            })
            .catch((error) => console.error('Error:', error));
    }
</script>
