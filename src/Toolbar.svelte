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
