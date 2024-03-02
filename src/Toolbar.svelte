<script>
    import Button from './components/Button.svelte';
    import Icon from './components/Icon.svelte';
    import defaultText from './toolbarDefaultText';
    import { writable, get } from 'svelte/store';

    // Store for toolbar content
    export const content = writable('');

    // Function to fetch and set initial content
    export function fetchContent() {
        // Simulate fetching content (replace with actual storage fetch)
        content.set('Initial content from storage');
    }

    // Expose content for initial fetch
    export function getContent() {
        return get(content);
    }

    // Placeholder for onTextChange registration
    let callOutsideOnInternalChange = null;

    export function registerTextChange(callback) {
        callOutsideOnInternalChange = callback;
    }

    export function onTextChange(text) {
        content.set(text);
    }

    // Simulate calling the registered callback on content change
    $: content,
        callOutsideOnInternalChange &&
            callOutsideOnInternalChange(get(content));
</script>

<span>
    <Button
        title="Start"
        buttonAction="{() => {
            console.log('calling callback');
            content.set(defaultText);
            callOutsideOnInternalChange(defaultText);
        }}"
    >
        New
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
<span>
    <Button>Login</Button>
</span>
