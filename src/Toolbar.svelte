<script>
    import Button from './components/Button.svelte';
    import registerIcons from './registerIcons.js';

    import Icon from './components/Icon.svelte';
    import defaultText from './toolbarDefaultText';
    import { writable, get } from 'svelte/store';
    import { onMount } from 'svelte';

    registerIcons();

    const TOKEN_KEY = 'google_token';
    const USER_KEY = 'google_user';

    const clientId = process.env.CLIENT_ID;
    const apiKey = process.env.API_KEY;
    const userInfo = writable(null);
    const accessToken = writable('');

    let originalTitle = 'QuizHub Editor';

    let fileId = null;
    let filename = writable('');

    $: if ($filename) {
        document.title = `${isUnsaved ? '*' : ''}${$filename} - ${originalTitle}`;
    } else {
        // If filename is empty or reset, revert to the original title
        document.title = originalTitle;
    }

    let isRenewing = false;
    let isLoading = false;
    let isSaving = false;
    let isUnsaved = false;
    let isSharing = false;
    let isRenaming = false;

    // Store for toolbar content
    export const content = writable('');

    export function getConfig() {
        let config = {
            title: get(filename),
        };
        let userInfo1 = get(userInfo);
        if (userInfo1) {
            config['authorName'] = userInfo1.name;
            config['authorUrl'] = 'mailto:' + userInfo1.email;
            config['authorImageUrl'] = userInfo1.picture;
        }
        return config;
    }

    function markdownDownload(url, fn, errorFn) {
        fetch(url)
            .then((response) => response.text())
            .then((text) => fn(text))
            .catch((error) => {
                console.error('Error fetching markdown:', error);
                errorFn(error);
            });
    }

    onMount(() => {
        document.documentElement.style.setProperty(
            '--quizdown-color-primary',
            '#1b73e8'
        );

        document.documentElement.style.setProperty(
            '--toolbar-color-primary',
            '#1b73e8'
        );

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
            getFileDetails();
            return;
        }

        const sourceUrl = queryParams.get('source') || queryParams.get('s');
        if (sourceUrl) {
            markdownDownload(sourceUrl, (text) => {
                content.set(text);
                callOutsideOnInternalChange(text);
            });
            return;
        }

        fetchStorageContent();
    });

    let renameDebounceTimer;

    function handleFilenameChange(event) {
        let newName = event.target.value;

        if (!newName) {
            console.log('Filename cannot be empty');
            return;
        }

        let currentAccesstoken = get(accessToken);
        if (!currentAccesstoken) {
            alert('Login required to rename file');
            return;
        }

        clearTimeout(renameDebounceTimer);

        renameDebounceTimer = setTimeout(() => {
            renameFile(fileId, newName, currentAccesstoken.token);
        }, 1000);
    }

    async function renameFile(fileId, newName, accessToken, afterRenameFn) {
        let newNameCopy = newName;
        if (!newName.endsWith('.md')) {
            newName = `${newName}.md`;
        }

        isRenaming = true;
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: new Headers({
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
                name: newName,
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('File renamed successfully:', result);
            if (afterRenameFn) {
                afterRenameFn(result);
            }
            isRenaming = false;

            filename.set(newNameCopy);

            // rerender the quiz intro
            callOutsideOnInternalChange(get(content));
            return result;
        } else {
            console.error('Failed to rename the file:', response.statusText);
            isRenaming = false;
            throw new Error('Failed to rename the file');
        }
    }

    function logout(relocate = false) {
        localStorage.removeItem(USER_KEY);
        userInfo.set(null);
        localStorage.removeItem(TOKEN_KEY);
        accessToken.set(null);
        sessionStorage.removeItem('liveEditorContent');
        if (relocate) {
            location.href = '/';
        }
    }

    async function getFileDetails() {
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
            isLoading = false;
            let message = await contentResponse.text();
            console.error(message);
            alert(
                'Failed to load this content. Maybe this file was modified by another application'
            );
            fileId = null;
            return;
        }

        const metadataResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`,
            { headers }
        );
        if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            let nameText = metadata.name;
            if (nameText.endsWith('.md')) {
                // Remove the last 3 characters (".md") from the string
                nameText = nameText.slice(0, -3);
            }
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
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
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
        callOutsideOnInternalChange(contentNew);
    }

    // Expose content for initial fetch
    export function getContent() {
        return get(content);
    }

    let callOutsideOnInternalChange = (text) => {};

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
        } else {
            isUnsaved = true;
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
            var view = new google.picker.DocsView()
                // filter by only markdown files (using mimetype works better than filename)
                // Disabled folder view, this shows all files in flat way, sorted by recency.
                .setMimeTypes('text/markdown')
                .setMode(google.picker.DocsViewMode.LIST) // Set the view mode to LIST instead of GRID
                .setOwnedByMe(true) // This limits to files owned by the user.
                .setSelectFolderEnabled(false); // Set to true if you want users to be able to select folders.

            const picker = new google.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(currentAccesstoken.token)
                .setDeveloperKey(apiKey)
                .setCallback(pickerCallback)
                .setInitialView(view)
                .setTitle('Select a Quiz file')
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
        isRenewing = true;
        // TODO: Check access token expiry
        // TODO: Check if curent file is saved, show confirmation.
        let name = 'Quiz';

        const fileMetadata = {
            name: name + '.md',
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

        isRenewing = false;

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
            // Update URL with file ID
            const currentUrl = window.location.href.split('?')[0];
            const newUrl = `${currentUrl}?gdrive=${file.id}`;

            if (newWindow) {
                window.open(newUrl, '_blank');
            } else {
                fileId = file.id;
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
                'Content-Type': 'text/markdown',
            }),
            body: newContent, // The new content of the file
        });

        if (response.ok) {
            isSaving = false;
            isUnsaved = false;
            // TODO: if user makes more changes during saving then save that as well.
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

{#if isLoading}
    <span></span>
    <div class="spinner"></div>
    <span></span>
{:else}
    <span
        style="padding-left: 10px; display: inline-flex; align-items: center;"
    >
        <a href="/">
            <Button title="Home">
                <img src="/icon.svg" alt="quiz home" style="height: 16px;" />
            </Button>
        </a>
    </span>
    {#if fileId}
        <span class="input-container">
            <input
                disabled="{isRenaming}"
                type="text"
                value="{$filename}"
                on:input="{handleFilenameChange}"
            />

            {#if isRenaming}
                <div class="spinner within-spinner"></div>
            {/if}
        </span>

        <!-- <a href="https://drive.google.com/file/d/{fileId}/view" target="_blank">
            [Drive]
        </a> -->
    {/if}

    <span style="display: inline-flex;">
        <span style="position: relative">
            <Button
                title="New"
                buttonAction="{() => {
                    createFileInDrive(true);
                }}"
                disabled="{isRenewing}"
                iconName="plus"
            ></Button>
            {#if isRenewing}
                <div class="spinner within-spinner"></div>
            {/if}
        </span>

        <Button
            title="Sample"
            buttonAction="{() => {
                let newContent = get(content) + '\n\n' + defaultText;
                content.set(newContent);
                callOutsideOnInternalChange(newContent);
            }}"
            iconName="list-ul"
        >
            Sample
        </Button>

        {#if $userInfo}
            <Button
                buttonAction="{openGooglePicker}"
                title="open"
                iconName="folder-open"
            ></Button>
        {/if}

        {#if $userInfo}
            <span style="position: relative">
                <Button
                    buttonAction="{save}"
                    disabled="{isSaving}"
                    title="Start"
                    iconName="floppy-disk"
                    color="{isUnsaved ? 'primary' : ''}"
                ></Button>
                {#if isSaving}
                    <div class="spinner within-spinner"></div>
                {/if}
            </span>
        {/if}
    </span>

    <!-- Right sided buttons -->
    <span style="padding-right: 10px; display:inline-flex;">
        {#if fileId}
            <span style="position: relative">
                <Button
                    buttonAction="{share}"
                    disabled="{isSharing}"
                    title="Share & Launch"
                    iconName="rocket">Launch</Button
                >
                {#if isSharing}
                    <div class="spinner within-spinner"></div>
                {/if}
            </span>
        {/if}

        {#if $userInfo}
            <div class="user-info">
                <img
                    class="user-image"
                    src="{$userInfo.picture}"
                    alt="{$userInfo.name}"
                />
                <span>{$userInfo.name}</span>
            </div>
            <Button
                buttonAction="{() => logout(true)}"
                iconName="right-from-bracket"
                title="logout"
            ></Button>
        {:else}
            <Button title="login" buttonAction="{handleSignIn}">Login</Button>
        {/if}

        <div id="signinDiv"></div>
    </span>
{/if}

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
        border: 4px solid color-mix(in srgb, white 90%, grey 10%);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border-left-color: var(--toolbar-color-primary);
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

    .input-container {
        width: 100%;
        position: relative;
        display: inline-block;
    }

    input[type='text'] {
        text-align: center;
        font-size: medium;
        width: 100%;
        min-width: 100px;
        height: 34px;
        box-sizing: border-box;
        border: 2px solid white;
        border-radius: 4px;
        background-color: white;
        transition:
            border-color 0.3s ease-in-out,
            box-shadow 0.3s ease-in-out;
    }

    .within-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: spin2 1s ease infinite;
    }
    @keyframes spin2 {
        0% {
            transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
            transform: translate(-50%, -50%) rotate(360deg);
        }
    }
    input[type='text']:hover:not(:disabled),
    input[type='text']:focus:not(:disabled) {
        outline: none;
        border-color: var(--toolbar-color-primary);
        box-shadow: 0 0 8px 0
            color-mix(in srgb, var(--toolbar-color-primary) 30%, white 70%);
    }

    input[type='text']:disabled {
        background-color: white;
        filter: grayscale(100%);
        color: gray;
        cursor: initial;
        opacity: 50%;
    }
</style>
