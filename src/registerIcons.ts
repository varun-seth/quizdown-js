import { library, config, IconDefinition, IconPack } from '@fortawesome/fontawesome-svg-core';
import {
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
	faPlay,
} from '@fortawesome/free-solid-svg-icons';

import {
    faSquare as faSquareRegular,
    faCircle as faCircleRegular,
    faDotCircle as faDotCircleRegular,
} from '@fortawesome/free-regular-svg-icons';

function isIconDefinition(icon: any): icon is IconDefinition {
    return icon && typeof icon === 'object' && 'iconName' in icon && 'prefix' in icon;
}

export default function() {
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
    ].filter(isIconDefinition);

    library.add(...icons as IconDefinition[]);
}
