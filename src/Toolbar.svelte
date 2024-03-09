<script>
    import Button from './components/Button.svelte';
    import Icon from './components/Icon.svelte';
    import defaultText from './toolbarDefaultText';
    import { writable, get } from 'svelte/store';
    import { onMount } from 'svelte';

    const TOKEN_KEY = 'google_token';
    const USER_KEY = 'google_user';

    const clientId = process.env.CLIENT_ID;
    const apiKey = process.env.API_KEY;
    const userInfo = writable(null);
    const accessToken = writable('');

    let fileId = null;
    let filename = writable('');

    let isLoading = false;
    let isSaving = false;
    let isSharing = false;

    // Store for toolbar content
    export const content = writable('');

    onMount(() => {
        const storedUserInfo = localStorage.getItem(USER_KEY);
        if (storedUserInfo) {
            userInfo.set(JSON.parse(storedUserInfo));
        }
        const storedAccessToken = localStorage.getItem(TOKEN_KEY);
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

    function logout() {
        localStorage.removeItem(USER_KEY);
        userInfo.set(null);
        localStorage.removeItem(TOKEN_KEY);
        accessToken.set(null);
    }

    async function getFileDetails(fileId) {
        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            alert('Login required to Edit file');
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

        if (contentResponse.status == 401) {
            logout();
            alert('Please login again');
            return;
        }

        if (contentResponse.ok) {
            let fileContentText = await contentResponse.text();
            content.set(fileContentText);
            callOutsideOnInternalChange(fileContentText);
        } else {
            alert('Failed to load.');
            console.error('Failed to fetch file content');
            return;
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
        localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenInfo));
        accessToken.set(tokenInfo);
        fetchUserProfile(response.access_token);
    }

    function handleSignIn() {
        google.accounts.oauth2
            .initTokenClient({
                client_id: clientId,
                scope: 'email profile https://www.googleapis.com/auth/drive.file ',
                // 'https://www.googleapis.com/auth/drive.metadata ' +
                // 'https://www.googleapis.com/auth/drive',
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
                localStorage.setItem(USER_KEY, JSON.stringify(data));
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
            alert('Please login to open files from Google Drive');
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
            // TODO: reset the state instead of reloading.
            window.location.reload();
        }
    }

    async function createFileInDrive(newWindow = true, callbackFn) {
        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            content.set('');
            callOutsideOnInternalChange('');
            return;
        }
        // TODO: Check access token expiry
        // TODO: Check if curent file is saved, show confirmation.
        let name = 'Quiz.md';

        const fileMetadata = {
            name: name,
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

        if (response.status === 401) {
            logout();
            alert('Please login again');
            return;
        } else if (!response.ok) {
            // Handle other errors
            throw new Error(
                `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
            );
        }

        const file = await response.json();

        if (file.id) {
            fileId = file.id;
            // Update URL with file ID
            const currentUrl = window.location.href.split('?')[0];
            const newUrl = `${currentUrl}?gdrive=${file.id}`;

            if (newWindow) {
                window.open(newUrl, '_blank');
            } else {
                filename.set(name);
                window.history.pushState({ path: newUrl }, '', newUrl);
            }

            if (callbackFn) {
                callbackFn(file.id);
            }

            return file.id; // Return the file ID
        } else {
            console.error('Failed to create file in Drive');
            return null;
        }
    }

    async function saveFileToDrive(
        fileId,
        accessToken,
        newContent,
        callbackOnSaved
    ) {
        isSaving = true;
        const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: new Headers({
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'text/plain', // Adjust based on the file type you're updating
            }),
            body: newContent, // The new content of the file
        });

        if (response.ok) {
            isSaving = false;
            const result = await response.json();
            console.log('File updated successfully:', result);
            if (callbackOnSaved) {
                callbackOnSaved(result);
            }
            return result;
        } else {
            isSaving = false;
            console.error('Failed to update the file:', response.statusText);
            throw new Error('Failed to update the file');
        }
    }

    function share() {
        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            alert('Please login before sharing');
            return true;
        }
        if (!fileId) {
            alert('Please save before sharing');
            return true;
        }

        shareFile(fileId, currentAccesstoken.token, (result) => {
            const currentUrl = window.location.origin;
            const newUrl = `${currentUrl}?gdrive=${fileId}`;

            window.open(newUrl, '_blank');
        });
    }

    async function shareFile(fileId, accessToken, afterShareFn) {
        isSharing = true;
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: new Headers({
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
                role: 'reader',
                type: 'anyone',
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('File made public successfully:', result);
            if (afterShareFn) {
                afterShareFn(result);
            }
            isSharing = false;
            return result;
        } else {
            console.error(
                'Failed to make the file public:',
                response.statusText
            );
            isSharing = false;
            throw new Error('Failed to make the file public');
        }
    }

    export function save() {
        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            console.log('Downloading');
            downloadContent(get(content), 'Quiz.md');
            return true;
        }

        if (fileId) {
            saveFileToDrive(fileId, currentAccesstoken.token, get(content));
        } else {
            createFileInDrive(false, (fileId) => {
                // try saving again.
                saveFileToDrive(
                    fileId,
                    currentAccesstoken.token,
                    get(content),
                    (result) => {
                        sessionStorage.setItem('liveEditorContent', '');
                    }
                );
            });
        }
        return true;
    }

    function downloadContent(content, filename) {
        let element = document.createElement('a');
        element.setAttribute(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
        );
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
</script>

<span style="padding-left: 10px; display: inline-flex">
    <a href="/">
        <Button>
            <img src="/icon.svg" alt="quiz home" style="height: 16px;" />
        </Button>
    </a>
    <Button
        title="Start"
        buttonAction="{() => {
            createFileInDrive(true);
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

    {#if $userInfo}
        <Button buttonAction="{openGooglePicker}">Open</Button>
    {/if}
</span>

{#if isLoading}
    <div class="spinner"></div>
{/if}

{#if $filename}
    <a href="https://drive.google.com/file/d/{fileId}/view" target="_blank">
        {$filename}
    </a>
{/if}

<!-- Right sided buttons -->
<span style="padding-right: 10px; display:inline-flex; gap: 10px;">
    <Button buttonAction="{save}">
        {#if isSaving}
            Saving
            <div class="spinner"></div>
        {:else}
            Save
        {/if}
    </Button>

    <Button buttonAction="{share}">
        {#if isSharing}
            Sharing
            <div class="spinner"></div>
        {:else}
            Share & Launch
        {/if}
    </Button>

    {#if $userInfo}
        <Button buttonAction="{logout}">Logout</Button>

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
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border-left-color: var(--quizdown-color-primary);
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
