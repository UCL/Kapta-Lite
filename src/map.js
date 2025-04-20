//import leaflet styling explicitly to avoid errors
import "../node_modules/leaflet/dist/leaflet.css";

import "leaflet-easybutton";
import "leaflet-easyprint";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useRef, useCallback } from "react";
import "./styles/map-etc.css";
import { isMobileOrTablet } from "./main.js";

import L from "leaflet";
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	CircleMarker,
	useMap,
	ScaleControl,
	AttributionControl,
} from "react-leaflet";

import { MapActionArea, ShareModal } from "./mapOverlays.js";
import {
	basemapGMapsIcon,
	basemapSatIcon,
	GPSPositionIcn,
	WhatAppMapMarkerPosition,
	WhatAppMapMarker,
	WhatAppMapper,
	WhatAppMapperPosition,
	GPSIcn,
	nextIcn,
} from "./icons.js";
import { MAPBOX_TOKEN } from "../globals.js";
import { UploadDialog } from "./UploadDialog.jsx";
import SuccessModal from "./SuccessModal.jsx";
import { wamapperslocations } from "./wamapperslocations.js";
import KaptaMarker from "./images/KaptaLiteMarker.png"; // Import the image

/************************************************************************************************
 *   Basemaps (TileLayers)
 ************************************************************************************************/

function GMapsTileLayer() {
	return (
		<TileLayer
			url={`https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}`}
			minZoom={2}
			maxZoom={21}
			maxNativeZoom={21}
			opacity={1}
			subdomains={["mt0", "mt1", "mt2", "mt3"]}
			attribution=" Google "
			crossOrigin="anonymous"
		/>
	);
}


function SatelliteTileLayer() {
	return (
		<TileLayer
			url={`http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}`}
			minZoom={2}
			maxZoom={21}
			maxNativeZoom={21}
			opacity={1}
			subdomains={["mt0", "mt1", "mt2", "mt3"]}
			attribution=" Google "
			crossOrigin="anonymous"
		/>
	);
}

function OSMTileLayer() {
    return (
        <TileLayer
            url={`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`}
            minZoom={2}
            maxZoom={21}
            maxNativeZoom={21}
            opacity={1}
            // subdomains={["mt0", "mt1", "mt2", "mt3"]}
            attribution=" OSM Contributors "
            crossOrigin="anonymous"
        />
    );
}

/************************************************************************************************
 * Display Data
 ***********************************************************************************************/
var markerOptions = {
	radius: 5,
	weight: 0,
	opacity: 1,
	fillOpacity: 0.8,
};

function getFriendlyDatetime(datetime) {
	// Convert the datetime string into a more readable form
	return datetime.split("T").join(" ").replaceAll("-", "/");
}
const getImageURLFromZip = async (zip, imgFilename) => {
	try {
		const file = zip.file(
			new RegExp(imgFilename.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$")
		);
		if (!file) {
			console.error(`File not found in ZIP: ${imgFilename}`);
			return null;
		}
		const blob = await file[0].async("blob");
		let urlCreator = window.URL || window.webkitURL;
		let url = urlCreator.createObjectURL(blob);
		return url;
	} catch (error) {
		console.error(`Error extracting file ${imgFilename}:`, error);
		return null;
	}
};



function MapDataLayer({ data }) {
	const { t } = useTranslation();
	const map = useMap();
	const boundsRef = useRef([]);
	const { data: geoJSON, imgZip } = data;
	const [featureImages, setFeatureImages] = useState({}); // this is basically a cache
    // Define a custom GPS icon
    const WhatsAppMarkerIcon = L.divIcon({
		html: WhatAppMapMarkerPosition, // 
		className: "whatsapp-marker-icon",
		iconSize: [30, 30], // Adjust size as needed
		iconAnchor: [15, 30], // Anchor point for the icon
	});
	if (geoJSON.features.length == 0) {
		// need translation
		return <ErrorPopup error="No data to display" />;
	}

	useEffect(() => {
		// fit map to bounds
		if (boundsRef.current.length > 0) {
			map.fitBounds(boundsRef.current);
		}
	}, [geoJSON, map]);

	const handleMarkerClick = useCallback(
		async (feature) => {
			if (imgZip && feature.properties.imgFilenames.length > 0) {
				// will want to map over imgFilenames when we support multiple
				feature.properties.imgFilenames.map(async (filename) =>
					// check the image isn't already loaded
					{
						if (filename && !featureImages[filename]) {
							const url = await getImageURLFromZip(imgZip, filename);
							setFeatureImages((prev) => ({
								...prev,
								[filename]: url,
							}));
						}
					}
				);
			}
		},
		[imgZip, featureImages]
	);

	return (
		<>
			{geoJSON.features.map((feature, index) => {
				if (feature.geometry?.coordinates) {
					const { coordinates } = feature.geometry;
					const latlng = { lat: coordinates[1], lng: coordinates[0] };

					const observations = feature.properties.observations
						.replace(/remove_this_msg/g, "")
						.replace(/<br\s*\/?>/gi, "\n");
					boundsRef.current.push([latlng.lat, latlng.lng]);

					const markerColour = feature.properties.markerColour
						? feature.properties.markerColour
						: "red";

					const imgFilenames = feature.properties.imgFilenames;
					return (
			
							<Marker
								key={index}
								position={latlng}
								icon={WhatsAppMarkerIcon}
								eventHandlers={{
									click: () => handleMarkerClick(feature),
								}}
							>
								<Popup offset={L.point(2, -15)} maxWidth={200} maxHeight={400}>
								<div className="map-popup-body">
									{imgFilenames && imgFilenames.length > 0 && (
										<div
											className="feature-images"
											onClick={(e) => {
												e.stopPropagation();
												const images = document.querySelectorAll(
													".feature-images img"
												);
												const currentIndex = [...images].findIndex(
													(img) => img.style.display === "block"
												);
												for (let i = 0; i < images.length; i++) {
													images[i].style.display = "none"; // Hide all images
												}
												const nextIndex = (currentIndex + 1) % images.length; // Loop back to the first image
												images[nextIndex].style.display = "block"; // Show the next image
											}}
										>
											{imgFilenames.map(
												(filename, index) =>
													featureImages[filename] && (
														<img
															key={index}
															src={featureImages[filename]}
															alt={`Feature image ${index + 1}`}
															style={{
																display: index > 0 ? "none" : "block",
															}}
														/>
													)
											)}
											{imgFilenames.length > 1 && (
												<div className="next-image">{nextIcn}</div>
											)}
										</div>
									)}
									{observations.split("\n").map((o, index) => (
										<p key={index}>{o}</p>
									))}
								</div>
								<div className="map-popup-footer">
									{t("date")}:{" "}
									{getFriendlyDatetime(feature.properties.datetime)}
									<br />
									{t("observer")}: {feature.properties.observer}
								</div>
							</Popup>
							</Marker>
						);
						

				}
			})}
		</>
	);
}

/************************************************************************************************
 *  Location of WhatsApp Mappers
 ************************************************************************************************/

function WhatsAppMappersDataLayer({ data }) {
	const { t } = useTranslation();
	const map = useMap();
	const boundsRef = useRef([]);
	// const { data: geoJSON, imgZip } = data;
	const [featureImages, setFeatureImages] = useState({}); // this is basically a cache
	const geoJSON = wamapperslocations;

    const WhatsAppMapperIcon = L.divIcon({
		html: WhatAppMapperPosition, // Use the imported GPS icon
		className: "whatsapp-mapper-icon",
		iconSize: [30, 30], // Adjust size as needed
		iconAnchor: [15, 30], // Anchor point for the icon
	});
	if (geoJSON.features.length == 0) {
		// need translation
		return <ErrorPopup error="No data to display" />;
	}

	useEffect(() => {
		// fit map to bounds
		if (boundsRef.current.length > 0) {
			map.fitBounds(boundsRef.current);
		}
	}, [geoJSON, map]);

	// const handleMarkerClick = useCallback(
	// 	async (feature) => {
	// 		if (imgZip && feature.properties.imgFilenames.length > 0) {
	// 			// will want to map over imgFilenames when we support multiple
	// 			feature.properties.imgFilenames.map(async (filename) =>
	// 				// check the image isn't already loaded
	// 				{
	// 					if (filename && !featureImages[filename]) {
	// 						const url = await getImageURLFromZip(imgZip, filename);
	// 						setFeatureImages((prev) => ({
	// 							...prev,
	// 							[filename]: url,
	// 						}));
	// 					}
	// 				}
	// 			);
	// 		}
	// 	},
	// 	[imgZip, featureImages]
	// );

	return (
		<>
  {wamapperslocations.features.map((feature, i) => {
    const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
    const { name, Description, KaptaID} = feature.properties; 
    const whatsappUrl = `https://wa.me/447473522912?text=Hi,%20please%20connect%20me%20with%20${name}%20%28${KaptaID}%29`;

    return (
      <Marker key={i} position={latlng} icon={WhatsAppMapperIcon}>
        <Popup offset={L.point(2, -15)} maxWidth={200} maxHeight={400}>
          <h3>{name}</h3>
          <p>{Description}</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#25D366",
              color: "white",
              borderRadius: "5px",
              fontWeight: "bold",
              textDecoration: "none",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            }}
          >
            Contact {name}
          </a>
        </Popup>
      </Marker>
    );
  })}
</>

	);
}

/************************************************************************************************
 *  Error Popup
 ************************************************************************************************/
function ErrorPopup({ error }) {
	const map = useMap();
	// Adjust the map view to a central location (e.g., coordinates [0, 0])
	useEffect(() => {
		if (error) {
			map.setView([0, 0], map.getZoom(), { animate: true }); // Center the map
		}
	}, [error, map]);

	return error ? (
		<Popup offset={L.point(0, -15)}
			maxWidth={200} maxHeight={400}
			position={[2, 0]} // Position within the map (centered in this case)
			autoPan={true}
			autoClose={false}
		>
			<div>
				<h2 className="error-popup">{error}</h2>
			</div>
		</Popup>
	) : null;
}

/************************************************************************************************
 *  Map
 ************************************************************************************************/

var southWest = L.latLng(-70, -180);
var northEast = L.latLng(80, 180);
console.log("ismobileortrable",isMobileOrTablet())
if (!isMobileOrTablet()) {
      var zoomOnload = 3; //to avoid multiple global maps displayed     
    }else{
	  var zoomOnload = 3; 
	}
const mapConfig = {
	center: [0, 0],
	zoom: zoomOnload,
	minZoom: 2,
	maxZoom: 21,
	zoomControl: false,
	attributionControl: false,
	style: { height: "100vh", width: "100%" },
	maxBounds: L.latLngBounds(southWest, northEast),
	preferCanvas: true,
};
const currentPositionIcon = L.divIcon({
	html: GPSPositionIcn,
	className: "position-marker-icon",
	iconSize: [30, 30],
	iconAnchor: [15, 15],
});

function UpdateMap({ currentLocation, flyToLocation, setFlyToLocation }) {
	// this is a functional component, it doesn't render anything
	// hook to fly to current location when updated
	const map = useMap();
	useEffect(() => {
		if (currentLocation && flyToLocation) {
			map.flyTo(currentLocation, map.getZoom());
			setFlyToLocation(false);
		}
	}, [currentLocation, flyToLocation]);

	return null;
}

export function Map({
    isVisible,
    data,
    isLoginVisible,
    setIsLoginVisible,
}) {
    if (!isVisible) return null;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const [titleValue, setTitleValue] = useState("");
    const [shouldPulse, setShouldPulse] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [flyToLocation, setFlyToLocation] = useState(false);
    const [error, setError] = useState(null);
    const [showWaMappers, setShowWaMappers] = useState(false);

    // State to track the active tile layer
    const [activeTileLayer, setActiveTileLayer] = useState("gmaps");
	useEffect(() => {
		const map = document.querySelector(".leaflet-control-attribution");
	
		if (map) {
			// Clear existing attributions
			map.innerHTML = "Leaflet";
	
			// Add correct attribution based on active layer
			if (activeTileLayer === "osm") {
				map.innerHTML += ' | OSM Contributors';
			} else {
				map.innerHTML += " | Google";
			}
		}
	}, [activeTileLayer]);
	
    // pulse effect on title update
    useEffect(() => {
        if (shouldPulse) {
            const timer = setTimeout(() => {
                setShouldPulse(false);
            }, 6000);
            return () => clearTimeout(timer); // Cleanup to avoid memory leaks
        }
    }, [shouldPulse]);

    const getCurrentPosition = () => {
        currentLocation && setFlyToLocation(true);
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        };
        const success = (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCurrentLocation([lat, lng]);
            setFlyToLocation(true);
        };
        const error = (err) => {
            console.warn(`ERROR(${err.code}): ${err.message}`);
            setError(
                "Unable to retrieve location. Please check your device settings."
            );
        };
        // call the above if the browser supports it
        navigator.geolocation
            ? navigator.geolocation.getCurrentPosition(success, error, options)
            : console.error("GPS not available");
    };

    return (
        <>
            <SuccessModal
                isVisible={successModalVisible}
                setIsVisible={setSuccessModalVisible}
            />
            <UploadDialog
                isOpen={isUploadDialogOpen}
                setIsOpen={setIsUploadDialogOpen}
                currentDataset={data?.data}
                setSuccessModalVisible={setSuccessModalVisible}
                isLoginVisible={isLoginVisible}
                setIsLoginVisible={setIsLoginVisible}
            />
            <ShareModal
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
                currentDataset={data?.data}
                setIsUploadDialogOpen={setIsUploadDialogOpen}
            />
            <div id="map">
                <div className={`map-title ${shouldPulse ? "pulse-shadow" : ""}`}>
                    {titleValue}
                </div>
                <button
                    id="base-map--toggle"
                    className="map-button"
                    onClick={() =>
                        setActiveTileLayer((prev) =>
                            prev === "gmaps" ? "satellite" : prev === "satellite" ? "osm" : "gmaps"
                        )
                    }
                >
                    {basemapGMapsIcon}
                </button>
                <button id="gps" className="map-button" onClick={getCurrentPosition}>
                    {GPSIcn}
                </button>
                <MapContainer {...mapConfig}>
                    {/* Determine which basemap to show */}
                    {activeTileLayer === "gmaps" && <GMapsTileLayer />}
                    {activeTileLayer === "satellite" && <SatelliteTileLayer />}
                    {activeTileLayer === "osm" && <OSMTileLayer />}
                    {/* current position marker */}
                    {currentLocation && (
                        <Marker position={currentLocation} icon={currentPositionIcon}>
                            <Popup offset={L.point(-8, -15)} maxWidth={200} maxHeight={400}> 
                                <p style={{ textAlign: "center", fontWeight: 600 }}>
                                    You're here!
                                </p>
                                <p style={{ textAlign: "center" }}>
                                    {currentLocation.join(", ")}
                                </p>
                            </Popup>
                        </Marker>
                    )}
                    {/* error if currentLocation can't be found */}
                    {error && <ErrorPopup />}
                    {data && <MapDataLayer data={data} />}
                    {showWaMappers && <WhatsAppMappersDataLayer />}
                    <UpdateMap
                        currentLocation={currentLocation}
                        flyToLocation={flyToLocation}
                        setFlyToLocation={setFlyToLocation}
                    />
                    <ScaleControl position="bottomleft" metric={true} imperial={false} />
                    <AttributionControl
                        position="bottomright"
                        prefix="Leaflet"
						// attribution={activeTileLayer === "osm" ? "OSM Contributors" : "Google"}
                    />
                </MapContainer>
                <MapActionArea
                    setTitle={setTitleValue}
                    setPulse={setShouldPulse}
                    setModalOpen={setIsModalOpen}
                    currentDataset={data?.data}
                    showWaMappers={showWaMappers}
                    setShowWaMappers={setShowWaMappers}
                />
            </div>
        </>
    );
}