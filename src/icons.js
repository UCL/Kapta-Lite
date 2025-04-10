import { library, icon } from "@fortawesome/fontawesome-svg-core";
import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
	faChevronDown,
	faChevronUp,
	faImage,
	faShareNodes,
	faFileCode,
	faFileCirclePlus,
	faForwardStep,
	faCloudArrowUp,
	faLocationCrosshairs,
	faSun,
	faMoon,
	faArrowLeft,
	faX,
	faThumbsUp,
	faMessage,
	faBars,
	faInfoCircle,
	faLayerGroup,
	faPlus,
	faArrowUpRightFromSquare,
	faLocationDot,
	// faWhatsapp,
} from "@fortawesome/free-solid-svg-icons";
import {
	faCircleDot,
} from "@fortawesome/free-regular-svg-icons";

import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import KaptaMarker from "./images/KaptaLiteMarker.png"; // Import the image
import KaptaMapper from "./images/KaptaLiteMapper.png"; // Import the image
import WABusinessIcon from "./images/WABusinessIcon.png"; // Import the image

// Add fontawesome icons to library
library.add(
	faChevronDown,
	faChevronUp,
	faImage,
	faShareNodes,
	faFileCode,
	faFileCirclePlus,
	faForwardStep,
	faCloudArrowUp,
	faLocationCrosshairs,
	faSun,
	faMoon,
	faArrowLeft,
	faCircleDot,
	faX,
	faThumbsUp,
	faMessage,
	faBars,
	faGithub,
	faInfoCircle,
	faLayerGroup,
	faWhatsapp,
	faPlus,
	faArrowUpRightFromSquare,
	faLocationDot
);
// we use .btn-icon but there is no global styling for it, only ever nested,
// which allows for easy selecting and flexible styling
export const chevronDown = <FontAwesomeIcon icon={faChevronDown} />;
export const chevronUp = <FontAwesomeIcon icon={faChevronUp} />;
export const nextIcn = <FontAwesomeIcon icon={faForwardStep} />;
export const imageIcn = <FontAwesomeIcon icon={faImage} className="btn-icon" />;
export const shareIcn = <FontAwesomeIcon icon={faShareNodes} style={{ color: "#3a3a3a" }} />;
export const createIcn = <FontAwesomeIcon icon={faPlus} style={{ color: "#3a3a3a" }} />;
export const premiumIcn = <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ color: "#3a3a3a" }} />;


export const dataIcn = (
	<FontAwesomeIcon icon={faFileCode} className="btn-icon" />
);
export const addMetaIcn = (
	<FontAwesomeIcon
		icon={faFileCirclePlus}
		style={{ fontSize: "0.75rem" }}
		className="btn-icon"
	/>
);
export const uploadIcn = (
	<FontAwesomeIcon icon={faCloudArrowUp} className="btn-icon" />
);
export const WhatAppMapper = <FontAwesomeIcon icon={faWhatsapp} style={{ color: "#05ad29" }}/>;
// export const WhatAppMapMarker = <FontAwesomeIcon icon={faLocationDot} style={{ color: "#05ad29" }}/>;
// export const WhatAppMapMarkerPosition = (
// 	<img
// 	  src={KaptaMarker}
// 	  alt="Kapta Marker"
// 	  style={{ width: "20px", height: "20px" }}
// 	/>
//   );
export const GPSIcn = <FontAwesomeIcon icon={faLocationCrosshairs} style={{ color: "#3a3a3a" }}/>;
export const basemapSatIcon = <FontAwesomeIcon icon={faLayerGroup} style={{ color: "#3a3a3a" }}/>;
export const basemapDarkIcon = <FontAwesomeIcon icon={faLayerGroup} style={{ color: "#3a3a3a" }}/>;
export const exitButtonIcon = (
	<FontAwesomeIcon icon={faArrowLeft} className="btn-icon" />
);
export const GPSPositionIcn = icon(faCircleDot).html;
export const WhatAppMapMarkerPosition = `
  <img
    src="${KaptaMarker}"
    alt="Kapta Marker"
    style="width: 35px; height: 35px;"
  />
`;
// export const WhatAppMapMarkerPosition = icon({
// 	prefix: "fa",
// 	iconName: "location-dot",
// }).html;

// export const WhatAppMapperPosition = icon(faWhatsapp).html;

export const WhatAppMapperPosition = `
  <img
    src="${KaptaMapper}"
    alt="Kapta Mapper"
    style="width: 30px; height: 30px;"
  />
`;
export const closeIcon = <FontAwesomeIcon icon={faX} className="btn-icon" />;
// export const connectIcon = <FontAwesomeIcon icon={faWhatsapp} className="btn-icon" />;
export const connectIcon =   (
	<img
		src={WABusinessIcon}
		alt="WhatsApp Business Icon"
		style={{ width: "20px", height: "20px" }}
	/>
);

export const thumbsUpIcon = (
	<FontAwesomeIcon icon={faThumbsUp} className="btn-icon" />
);
export const msgIcon = (
	<FontAwesomeIcon icon={faMessage} className="btn-icon" />
);

// menu
export const menuIcon = <FontAwesomeIcon icon={faBars} />;
export const GHIcon = <FontAwesomeIcon icon={faGithub} />;
