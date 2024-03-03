<script>
    import Button from './components/Button.svelte';
    import Icon from './components/Icon.svelte';
    import defaultText from './toolbarDefaultText';
    import { writable, get } from 'svelte/store';
    import { onMount } from 'svelte';

    const clientId = process.env.CLIENT_ID;
    const apiKey = process.env.API_KEY;
    export const userInfo = writable(null);
    const accessToken = writable('');

    let fileId = null;
    let filename = writable('');

    let isLoading = false;

    // Store for toolbar content
    export const content = writable('');

    onMount(() => {
        const storedUserInfo = localStorage.getItem('google_info');
        if (storedUserInfo) {
            userInfo.set(JSON.parse(storedUserInfo));
        }
        const storedAccessToken = localStorage.getItem('google_token');
        if (storedAccessToken) {
            accessToken.set(JSON.parse(storedAccessToken));
        }

        const queryParams = new URLSearchParams(window.location.search);
        fileId = queryParams.get('gdrive');
        if (fileId) {
            // Proceed to make an API call to get the file
            getFileDetails(fileId);
        } else {
            fetchStorageContent();
        }
    });

    async function getFileDetails(fileId) {
        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            // handleSignIn();
            return;
        }

        const headers = new Headers({
            Authorization: `Bearer ${currentAccesstoken.token}`,
        });

        isLoading = true;

        const contentResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers }
        );
        if (contentResponse.ok) {
            let fileContentText = await contentResponse.text();
            content.set(fileContentText);
            callOutsideOnInternalChange(fileContentText);
        } else {
            console.error('Failed to fetch file content');
        }

        const metadataResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`,
            { headers }
        );
        if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            let nameText = metadata.name;
            filename.set(nameText);
        } else {
            console.error('Failed to fetch file metadata');
        }

        isLoading = false;
    }

    function handleAccessToken(response) {
        const tokenInfo = {
            expires_in: response.expires_in,
            expires: new Date().getTime() + response.expires_in * 1000,
            token: response.access_token,
        };
        localStorage.setItem('google_token', JSON.stringify(tokenInfo));
        fetchUserProfile(response.access_token);
    }

    function handleSignIn() {
        google.accounts.oauth2
            .initTokenClient({
                client_id: clientId,
                scope:
                    'email profile https://www.googleapis.com/auth/drive.file ' +
                    'https://www.googleapis.com/auth/drive.metadata ' +
                    'https://www.googleapis.com/auth/drive',
                callback: handleAccessToken,
            })
            .requestAccessToken(); // This opens the popup
    }

    function fetchUserProfile(accessToken) {
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                localStorage.setItem('google_info', JSON.stringify(data));
                userInfo.set(data);
            })
            .catch((error) => {
                console.error('Error fetching user information:', error);
            });
    }

    // Function to fetch and set initial content
    function fetchStorageContent() {
        // Simulate fetching content (replace with actual storage fetch)
        let contentNew = sessionStorage.getItem('liveEditorContent');
        if (!contentNew) {
            contentNew = defaultText;
        }
        content.set(contentNew);
    }

    // Expose content for initial fetch
    export function getContent() {
        return get(content);
    }

    let callOutsideOnInternalChange = null;

    export function registerTextChange(callback) {
        callOutsideOnInternalChange = callback;
    }

    export function onTextChange(text) {
        if (get(content) == text) {
            return;
        }
        content.set(text);
        if (!fileId) {
            sessionStorage.setItem('liveEditorContent', text);
            console.log('Updated content');
        }
    }

    // Simulate calling the registered callback on content change
    $: content,
        callOutsideOnInternalChange &&
            callOutsideOnInternalChange(get(content));

    function openGooglePicker() {
        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            handleSignIn();
            return;
        }

        // TODO: handle expiry

        // Ensure the Picker API is loaded
        gapi.load('picker', () => {
            var view = new google.picker.DocsView(google.picker.ViewId.DOCS)
                .setQuery('*.md') // Markdown files.
                .setIncludeFolders(true) // This shows folders in the picker
                .setMode(google.picker.DocsViewMode.LIST) // Set the view mode to LIST instead of GRID
                .setOwnedByMe(true) // This limits to files owned by the user.
                .setSelectFolderEnabled(false); // Set to true if you want users to be able to select folders.

            const picker = new google.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(currentAccesstoken.token)
                .setDeveloperKey(apiKey)
                .setCallback(pickerCallback)
                .setInitialView(view)
                .setTitle('Select a Quiz file (markdown files end with .md)')
                .build();

            picker.setVisible(true);
        });
    }

    function pickerCallback(data) {
        if (
            data[google.picker.Response.ACTION] === google.picker.Action.PICKED
        ) {
            const doc = data[google.picker.Response.DOCUMENTS][0];
            const fileId = doc[google.picker.Document.ID];

            // Update URL with the selected file ID
            const currentUrl = window.location.href.split('?')[0];
            const newUrl = `${currentUrl}?gdrive=${fileId}`;
            window.history.pushState({ path: newUrl }, '', newUrl);

            // Optionally, load or manipulate the selected file using its file ID
            console.log('Selected file ID: ', fileId);
        }
    }

    async function createFileInDrive() {
        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            content.set('');
            callOutsideOnInternalChange('');
            return;
        }
        // TODO: Check access token expiry
        // TODO: Check if curent file is saved, show confirmation.

        const fileMetadata = {
            name: 'Quiz.md',
            mimeType: 'text/markdown',
        };

        const response = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${currentAccesstoken.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fileMetadata),
            }
        );

        const file = await response.json();

        if (file.id) {
            // Update URL with file ID
            const currentUrl = window.location.href.split('?')[0];
            const newUrl = `${currentUrl}?gdrive=${file.id}`;
            // window.history.pushState({ path: newUrl }, '', newUrl);

            window.open(newUrl, '_blank');

            return file.id; // Return the file ID
        } else {
            console.error('Failed to create file in Drive');
            return null;
        }
    }
</script>

<span style="padding-left: 10px">
    <Button
        title="Start"
        buttonAction="{() => {
            createFileInDrive();
        }}"
    >
        New
    </Button>

    <Button
        title="Start"
        buttonAction="{() => {
            content.set(defaultText);
            callOutsideOnInternalChange(defaultText);
        }}"
    >
        Sample
    </Button>

    <Button buttonAction="{openGooglePicker}">Open</Button>
</span>

{#if isLoading}
    <div class="spinner"></div>
{/if}

{#if $filename}
    {$filename}
{/if}

<!-- Right sided buttons -->
<span style="padding-right: 10px">
    {#if $userInfo}
        <div class="user-info">
            <img
                class="user-image"
                src="{$userInfo.picture}"
                alt="{$userInfo.name}"
            />
            <span>{$userInfo.name}</span>
        </div>
    {:else}
        <Button buttonAction="{handleSignIn}">Login</Button>
    {/if}

    <div id="signinDiv"></div>
</span>

<style>
    .user-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        max-width: 150px;
    }
    .user-image {
        height: 32px;
        border-radius: 16px;
    }

    .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #09f;
        animation: spin 1s ease infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
