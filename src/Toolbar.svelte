<script>
    import Button from './components/Button.svelte';
    import Icon from './components/Icon.svelte';
    import defaultText from './toolbarDefaultText';
    import { writable, get } from 'svelte/store';
    import { onMount } from 'svelte';

    const clientId = process.env.CLIENT_ID;
    export const userInfo = writable(null);

    onMount(() => {
        const storedUserInfo = localStorage.getItem('google_info');
        if (storedUserInfo) {
            userInfo.set(JSON.parse(storedUserInfo));
        }
    });

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
                scope: 'email profile https://www.googleapis.com/auth/drive.file',
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

    // Store for toolbar content
    export const content = writable('');

    // Function to fetch and set initial content
    export function fetchContent() {
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
        sessionStorage.setItem('liveEditorContent', text);
        console.log('Updated content');
    }

    // Simulate calling the registered callback on content change
    $: content,
        callOutsideOnInternalChange &&
            callOutsideOnInternalChange(get(content));
</script>

<span style="padding-left: 10px">
    <Button
        title="Start"
        buttonAction="{() => {
            console.log('calling callback');
            content.set(defaultText);
            callOutsideOnInternalChange(defaultText);
        }}"
    >
        Sample
    </Button>

    <Button
        title="Start"
        buttonAction="{() => {
            console.log('calling callback');
            content.set('');
            callOutsideOnInternalChange('');
        }}"
    >
        Empty
    </Button>
</span>

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
</style>
