import { library, config } from '@fortawesome/fontawesome-svg-core';
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
} from '@fortawesome/free-solid-svg-icons';

import {
	faSquare as faSquareRegular, 
	faCircle as faCircleRegular,
	faDotCircle as faDotCircleRegular
} from '@fortawesome/free-regular-svg-icons';

export default function () {
    config.autoAddCss = false;
    library.add(
        faArrowLeft,
        faArrowRight,
        faRedo,
        faLightbulb,
		faCheckDouble,
        faCircleNotch,
		faCheckSquare,
		faSquare,
		faSquareRegular,
		faCircleRegular,
		faDotCircle,
		faDotCircleRegular,
    );
}
