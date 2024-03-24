import {
    library,
    config,
    IconDefinition,
    IconPack,
} from '@fortawesome/fontawesome-svg-core';
import {
    faArrowLeft, // navigation.prev
    faArrowRight, // navigation.next
    faRedo, // navigation.reset
    faCheckDouble,
    faCog,
    faCircleNotch, // loading component, not used currently.
    faLightbulb, // hint icon
    faCheckSquare, // MCQ checked
    faSquare, // MCQ unchecked
    faDotCircle, //
    faCircleCheck, // results -> correct
    faCircleXmark, // results -> wrong
    faPlay, // start button
    faClipboardList, // navigation.solutions
    faClipboardCheck, // navigation.evaluate
    faFloppyDisk,
    faPlus,
    faRocket,
    faFolderOpen,
    faListUl,
    faRightFromBracket,
    faInfoCircle,
    faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';

import {
    faSquare as faSquareRegular,
    faCircle as faCircleRegular,
    faDotCircle as faDotCircleRegular,
    faComment as faCommentRegular,
} from '@fortawesome/free-regular-svg-icons';

function isIconDefinition(icon: any): icon is IconDefinition {
    return (
        icon &&
        typeof icon === 'object' &&
        'iconName' in icon &&
        'prefix' in icon
    );
}

export default function () {
    config.autoAddCss = false;
    const icons = [
        faArrowLeft,
        faArrowRight,
        faRedo,
        faCheckDouble,
        faCog,
        faCircleNotch,
        faLightbulb,
        faCheckSquare,
        faSquare,
        faDotCircle,
        faCircleCheck,
        faCircleXmark,
        faSquareRegular,
        faCircleRegular,
        faDotCircleRegular,
        faPlay,
        faClipboardList,
        faClipboardCheck,
        faFloppyDisk,
        faPlus,
        faRocket,
        faFolderOpen,
        faListUl,
        faRightFromBracket,
        faCommentRegular,
        faInfoCircle,
        faQuestionCircle,
    ].filter(isIconDefinition);

    library.add(...(icons as IconDefinition[]));
}
