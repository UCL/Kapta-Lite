//import leaflet styling explicitly to avoid errors
import "../node_modules/leaflet/dist/leaflet.css";

import "leaflet-easybutton";
import "leaflet-easyprint";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useRef, useCallback } from "react";
import "./styles/map-etc.css";
import "./styles/image-viewer.css";
import "./styles/image-popup.css";
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
import { setGlobalProcessedChatFile } from "./import_whatsapp.js";
import * as JSZip from "jszip";
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
	editIcon,
	deleteIcon,
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



function MapDataLayer({ data, onUpdateFeature, onDeleteFeature, onUpdateImageLocation, onDeleteImageLocation, setMapData, updateGlobalDataFile }) {
	const { t } = useTranslation();
	const map = useMap();
	const boundsRef = useRef([]);
	const { data: geoJSON, imgZip } = data;
	const [featureImages, setFeatureImages] = useState({}); // this is basically a cache
	const [editingFeature, setEditingFeature] = useState(null);
	const [editObservation, setEditObservation] = useState("");
	const [editingLocation, setEditingLocation] = useState(null);
	const [editLocationDescription, setEditLocationDescription] = useState("");
    // Define a custom GPS icon
    const WhatsAppMarkerIcon = L.divIcon({
		html: WhatAppMapMarkerPosition, // 
		className: "whatsapp-marker-icon",
		iconSize: [30, 30], // Adjust size as needed
		iconAnchor: [15, 30], // Anchor point for the icon
	});
	
	// Check if it's the old WhatsApp format with features array or new format with locations object
	const isOldFormat = geoJSON.hasOwnProperty('features');
	const isNewImageFormat = !isOldFormat && geoJSON.hasOwnProperty('locations');
	
	useEffect(() => {
		// fit map to bounds
		if (boundsRef.current.length > 0) {
			map.fitBounds(boundsRef.current);
		}
	}, [geoJSON, map]);

	const handleMarkerClick = useCallback(
		async (feature) => {
			// Handle WhatsApp style image zip
			if (imgZip && feature.properties?.imgFilenames?.length > 0) {
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
	
	// If it's the old format with no features
	if (isOldFormat && geoJSON.features.length === 0) {
		// need translation
		return <ErrorPopup
  error={
    <>
      <span style={{ fontSize: "1rem", align: "center" }}>
        No data to display or parsing error. {" "}
      </span>
      <a
        href="https://wa.me/447473522912?text=Hi%2C%20I%20can%27t%20display%20the%20data.%20Please%20help."
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
		  marginTop: "1rem",
		  align: "center",
          marginLeft: "0.5rem",
          padding: "0.4rem 0.75rem",
          backgroundColor: "white",
          color: "black",
          border: "black 1px solid",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "1rem",
		  fontFamily: "Ubuntu, sans-serif",
          cursor: "pointer"
        }}
      >
        Contact us
      </a>
    </>
  }
/>

	}

	// Handle edit observation
	const handleEditObservation = (feature, newObservation) => {
		if (!data?.data?.features) return;
        
        const updatedData = { ...data };
        const featureIndex = updatedData.data.features.findIndex(f => 
            f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
            f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
            f.properties.datetime === feature.properties.datetime
        );
        
        if (featureIndex !== -1) {
            updatedData.data.features[featureIndex].properties.observations = newObservation;
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
        }
        
		setEditingFeature(null);
		setEditObservation("");
	};

	// Handle delete feature
	const handleDeleteFeature = (feature) => {
		if (window.confirm("Are you sure you want to delete this point?")) {
			if (!data?.data?.features) return;
        
            const updatedData = { ...data };
            updatedData.data.features = updatedData.data.features.filter(f => 
                !(f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
                  f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
                  f.properties.datetime === feature.properties.datetime)
            );
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
		}
	};

	// Handle edit image location description
	const handleEditLocationDescription = (locationId, newDescription) => {
		if (onUpdateImageLocation) {
			onUpdateImageLocation(locationId, { description: newDescription, address: newDescription });
		}
		setEditingLocation(null);
		setEditLocationDescription("");
	};

	// Handle delete image location
	const handleDeleteImageLocation = (locationId) => {
		if (window.confirm("Are you sure you want to delete this point?")) {
			if (onDeleteImageLocation) {
				onDeleteImageLocation(locationId);
			}
		}
	};

	// If it's the new image format with locations object
	if (isNewImageFormat) {
		return (
			<>
				{Object.values(geoJSON.locations).map((location, index) => {
					const latlng = { lat: location.latitude, lng: location.longitude };
					boundsRef.current.push([latlng.lat, latlng.lng]);
					
					return (
						<Marker
							key={index}
							position={latlng}
							icon={WhatsAppMarkerIcon}
						>
							<Popup offset={L.point(2, -15)} maxWidth={300} maxHeight={400}>
								<div className="map-popup-body">
									{location.imageUrl && (
										<div className="feature-images">
											<img
												src={location.imageUrl}
												alt="Geotagged image"
												style={{ display: "block", maxWidth: "100%" }}
											/>
										</div>
									)}
									{/* Editable description section */}
									{editingLocation === location.id ? (
										<div className="popup-observation-container">
											<textarea
												value={editLocationDescription}
												onChange={(e) => setEditLocationDescription(e.target.value)}
												className="popup-edit-textarea"
												autoFocus
											/>
											<div className="popup-edit-actions">
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleEditLocationDescription(location.id, editLocationDescription);
													}}
													className="popup-save-btn"
												>
													Save
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setEditingLocation(null);
														setEditLocationDescription("");
													}}
													className="popup-cancel-btn"
												>
													Cancel
												</button>
											</div>
										</div>
									) : (
										<div className="popup-observation-container">
											<div className="popup-observation-display">
												<div className="popup-observation-text">
													<p>{location.description || location.address || "Geotagged image location"}</p>
												</div>
												<div className="popup-edit-button-container">
													<button
														onClick={() => {
															setEditingLocation(location.id);
															setEditLocationDescription(location.description || location.address || "");
														}}
														className="popup-edit-btn"
														title="Edit description"
													>
														{editIcon}
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
								<div className="map-popup-footer">
									{t("date")}: {location.timestamp ? new Date(location.timestamp).toLocaleString() : "-"}
									<br />
									{t("observer")}: {geoJSON.people[location.sender]?.name || "Unknown"}
									<br />
									<strong>Coordinates:</strong><br />
									lat {latlng.lat.toFixed(6)}<br />
									lng {latlng.lng.toFixed(6)}
									{/* Delete button at bottom */}
									<div className="popup-bottom-delete-container">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteImageLocation(location.id);
											}}
											className="popup-bottom-delete-btn"
											title="Delete this point"
										>
											Delete
										</button>
									</div>
								</div>
							</Popup>
						</Marker>
					);
				})}
			</>
		);
	}

	// Handle old WhatsApp format
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
								<Popup offset={L.point(2, -15)} maxWidth={250} maxHeight={400}>
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
									{/* Editable observations section */}
									{editingFeature === feature ? (
										<div className="popup-observation-container">
											<textarea
												value={editObservation}
												onChange={(e) => setEditObservation(e.target.value)}
												className="popup-edit-textarea"
												autoFocus
											/>
											<div className="popup-edit-actions">
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleEditObservation(feature, editObservation);
													}}
													className="popup-save-btn"
												>
													Save
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setEditingFeature(null);
														setEditObservation("");
													}}
													className="popup-cancel-btn"
												>
													Cancel
												</button>
											</div>
										</div>
									) : (
										<div className="popup-observation-container">
											<div className="popup-observation-display">
												<div className="popup-observation-text">
													{observations.split("\n").map((o, index) => (
														<p key={index}>{o}</p>
													))}
												</div>
												<div className="popup-edit-button-container">
													<button
														onClick={(e) => {
															e.stopPropagation();
															setEditingFeature(feature);
															setEditObservation(observations);
														}}
														className="popup-edit-btn"
														title="Edit observation"
													>
														{editIcon}
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
								<div className="map-popup-footer">
									{t("date")}:{" "}
									{getFriendlyDatetime(feature.properties.datetime)}
									<br />
									{t("observer")}: {feature.properties.observer}
									<br />
									<strong>Coordinates:</strong><br />
									lat {latlng.lat}<br />
									lng {latlng.lng}
									{/* Delete button at bottom */}
									<div className="popup-bottom-delete-container">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteFeature(feature);
											}}
											className="popup-bottom-delete-btn"
											title="Delete this point"
										>
											Delete
										</button>
									</div>
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
    const whatsappUrl = `https://wa.me/447473522912?text=Hi,%20please%20connect%20me%20with%20${name}%20`;

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
            Contact {KaptaID}
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
    setMapData, // Add this to update the data
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

    // Handle feature updates (for editing observations)
    const handleUpdateFeature = (feature, updates) => {
        if (!data?.data?.features) return;
        
        const updatedData = { ...data };
        const featureIndex = updatedData.data.features.findIndex(f => 
            f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
            f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
            f.properties.datetime === feature.properties.datetime
        );
        
        if (featureIndex !== -1) {
            updatedData.data.features[featureIndex].properties = {
                ...updatedData.data.features[featureIndex].properties,
                ...updates
            };
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
        }
    };

    // Handle feature deletion
    const handleDeleteFeature = (feature) => {
        if (!data?.data?.features) return;
        
        const updatedData = { ...data };
        updatedData.data.features = updatedData.data.features.filter(f => 
            !(f.geometry.coordinates[0] === feature.geometry.coordinates[0] &&
              f.geometry.coordinates[1] === feature.geometry.coordinates[1] &&
              f.properties.datetime === feature.properties.datetime)
        );
        setMapData(updatedData);
        updateGlobalDataFile(updatedData);
    };

    // Handle image location updates (for new format)
    const handleUpdateImageLocation = (locationId, updates) => {
        if (!data?.data?.locations) return;
        
        const updatedData = { ...data };
        if (updatedData.data.locations[locationId]) {
            updatedData.data.locations[locationId] = {
                ...updatedData.data.locations[locationId],
                ...updates
            };
            setMapData(updatedData);
            updateGlobalDataFile(updatedData);
        }
    };

    // Handle image location deletion (for new format)
    const handleDeleteImageLocation = (locationId) => {
        if (!data?.data?.locations) return;
        
        const updatedData = { ...data };
        delete updatedData.data.locations[locationId];
        setMapData(updatedData);
        updateGlobalDataFile(updatedData);
    };

    // Function to update the global data file with changes
    const updateGlobalDataFile = async (updatedData) => {
        try {
            if (data?.imgZip) {
                // Re-create the zip file with updated data
                const zip = new JSZip();
                
                // Check if it's the new image format or old WhatsApp format
                if (updatedData.data.features) {
                    // For WhatsApp format, save as standard GeoJSON FeatureCollection
                    const geoJSONData = {
                        type: "FeatureCollection",
                        features: updatedData.data.features
                    };
                    const updatedGeoJSON = JSON.stringify(geoJSONData, null, 2);
                    zip.file("map.geojson", updatedGeoJSON);
                } else if (updatedData.data.locations) {
                    // For image format, convert locations to GeoJSON FeatureCollection format
                    const features = Object.values(updatedData.data.locations).map(location => ({
                        type: "Feature",
                        properties: {
                            contributionid: location.batch || location.id,
                            mainattribute: "Geotagged Images",
                            name: location.name,
                            datetime: location.timestamp,
                            observer: updatedData.data.people[location.senderId]?.name || "Unknown",
                            observations: location.description || location.address || "image_no_observation",
                            markerColour: "0",
                            imgFilenames: [location.name],
                            altitude: location.altitude?.toString() || "0"
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [location.longitude, location.latitude]
                        }
                    }));
                    
                    const geoJSONData = {
                        type: "FeatureCollection",
                        features: features
                    };
                    const updatedGeoJSON = JSON.stringify(geoJSONData, null, 2);
                    zip.file("map.geojson", updatedGeoJSON);
                }
                
                // Add existing files from the original zip (except the data file we just updated)
                try {
                    let originalZip;
                    if (data.imgZip instanceof File || data.imgZip instanceof Blob) {
                        originalZip = await JSZip.loadAsync(data.imgZip);
                    } else if (typeof data.imgZip === 'string') {
                        // Handle base64 string
                        originalZip = await JSZip.loadAsync(data.imgZip, {base64: true});
                    } else {
                        // Assume it's already ArrayBuffer or similar
                        originalZip = await JSZip.loadAsync(data.imgZip);
                    }
                    
                    const promises = [];
                    originalZip.forEach((relativePath, file) => {
                        if (relativePath !== "map.geojson" && relativePath !== "data.json") {
                            promises.push(
                                file.async("blob").then(blob => {
                                    zip.file(relativePath, blob);
                                })
                            );
                        }
                    });
                    
                    // Wait for all files to be added
                    await Promise.all(promises);
                } catch (zipError) {
                    console.warn("Could not load original zip, creating new one with just the data file:", zipError);
                }
                
                // Generate the updated zip file
                const updatedZipBlob = await zip.generateAsync({ type: "blob" });
                const updatedFile = new File([updatedZipBlob], "updated_map.zip", { type: "application/zip" });
                
                // Update the global file
                setGlobalProcessedChatFile(updatedFile);
            }
        } catch (error) {
            console.error("Error updating global data file:", error);
        }
    };
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
                    {data && <MapDataLayer 
                        data={data} 
                        onUpdateFeature={handleUpdateFeature}
                        onDeleteFeature={handleDeleteFeature}
                        onUpdateImageLocation={handleUpdateImageLocation}
                        onDeleteImageLocation={handleDeleteImageLocation}
                        setMapData={setMapData}
                        updateGlobalDataFile={updateGlobalDataFile}
                    />}
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