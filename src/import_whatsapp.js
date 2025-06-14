import * as JSZip from "jszip";
import { sha256, slugify } from "./utils.js";
import React, { useEffect, useCallback } from "react";
import { uploadProcessedChat } from "./data_submission";



export const colourPalette = [
	"#d0160f",
	"#80bf4d",
	"#b38300",
	"#3aedc5",
	"#c65a00",
	"#5fd789",
	"#9ca303",
	"#36fffd",
];

const getTimestamp = () => {
	// what's this meant to be for?
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
};
var timestamp = getTimestamp();
export let importdata = false; // Track whether FileParser is called
export let enableDownload = false; // To enable download


export function FileParser({ file, onComplete, ...dataDisplayProps }) {
	enableDownload = true
	if(!window.location.href.includes('?import=')){
		importdata = true; // Set to true when FileParser is called from WhatsApp, not from pre-signed URL (to avoid zip file uploads)
	}

	const { setMapData, showMap, setFileToParse } = dataDisplayProps;

	const setDataDisplayMap = useCallback(
		(data, name, imgZip = null) => {
			data = updateMapdata(data, name);

			setMapData({ data: data, imgZip: imgZip });

			showMap(true);
			// Call onComplete callback after parsing is done
			if (onComplete) {
				onComplete();
			}
		},
		[setMapData, showMap, setFileToParse]
	);

	useEffect(() => {
		if (file) {
			processFile(file, setDataDisplayMap);
		}
	}, [file]); // run when file changes

	return null; //don't render anything
}

const updateMapdata = (data, groupName = null) => {
	return {
		...data,
		slug: slugify(groupName || "Kapta"),
	};
};

export const allowedExtensions = [".zip", ".txt", ".geojson"];

export let globalProcessedChatFile = null;
const processFile = (file, setDataDisplayMap) => {
    if (
        file instanceof File &&
        allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
        try {
            if (file.name.endsWith(".zip")) {
                const zip = new JSZip();
                zip.loadAsync(file).then(function (contents) {
                    const filenames = Object.keys(contents.files);

                    // Detect GeoJSON file
                    const geojsonFilename = filenames.find((filename) =>
                        filename.match(/.*\.geojson$/i)
                    );

                    // Detect chat file
                    const chatFilename = filenames.find((filename) =>
                        filename.match(/.*\.txt$/i)
                    );
					if (geojsonFilename) {
                        zip
                            .file(geojsonFilename)
                            .async("string")
                            .then(async function (geojsonContent) {
                                try {
                                    const [data, name] = processGeoJson(geojsonContent);
                                    setDataDisplayMap(data, name, zip);
									globalProcessedChatFile = file;

                                } catch (error) {
                                    console.error("Error processing GeoJSON file:", error);
                                }
                            });
                    }
                    // Process chat file if it exists
                    if (chatFilename) {
                        zip
                            .file(chatFilename)
                            .async("string")
                            .then(async function (fileContent) {
                                const [data, name, processedChatFile] = await processText(
                                    fileContent,
                                    zip
                                );
                                setDataDisplayMap(data, name, zip);
								globalProcessedChatFile = processedChatFile;

                                // Pass the processedChatFile to the upload function
                                // uploadProcessedChat(processedChatFile, (text) => {
                                //     console.log(text);
                                // }, (disabled) => {
                                //     console.log(disabled);
                                // });
								
                            });
					
                    }
                });
            } else {
                // Handle text or GeoJSON files directly
                reader.readAsText(file);
                reader.onloadend = async function (e) {
                    const content = e.target.result;
                    const geoJSONRegex = /^\s*{\s*"type"/;

                    // Process as GeoJSON if the file extension is .geojson or content starts with { "type"
                    if (file.name.endsWith(".geojson") || geoJSONRegex.test(content)) {
                        try {
                            const [data, name] = processGeoJson(content);
                            setDataDisplayMap(data, name);
                        } catch (error) {
                            console.error("Error parsing GeoJSON:", error);
                        }
                    } else {
                        // Process as text
                        const [data, name] = await processText(e.target.result);
                        setDataDisplayMap(data, name);
                    }
                };
            }
        } catch (error) {
            console.error("Unsupported file or format", error);
        }
    }
};

const getSenderColour = (senders) => {
	// Select a colour depending on number of keys in the object provided
	return colourPalette[Object.keys(senders).length % colourPalette.length];
};

const formatDateString = (date, time) => {
	// Given strings representing a date in various formats (mm/dd/yyyy, dd/mm/yy, etc) and a time in 12 or 24 hour format, including or excluding seconds, return a string in the format YYYY-MM-DDTHH:MM:SS

	// Check if time includes AM/PM to determine the format
	const is12HourFormat =
		time.toLowerCase().includes("am") || time.toLowerCase().includes("pm");
	let hour, min, sec;
	if (is12HourFormat) {
		// Handle 12-hour format
		let [timePart, meridiem] = time.toLowerCase().split(" ");
		[hour, min, sec = "00"] = timePart.split(":");

		// Convert 12-hour to 24-hour format
		if (meridiem === "pm" && hour !== "12") {
			hour = parseInt(hour, 10) + 12;
		} else if (meridiem === "am" && hour === "12") {
			hour = "00";
		}
	} else [hour, min, sec = "00"] = time.split(":"); // 24hr format used already

	// split date string into parts and then determine which is what
	let [part1, part2, part3] = date.split("/");

	let day, month, year;

	if (part1.length === 4) {
		year = part1;
		month = part2;
		day = part3;
	} else if (part3.length === 4) {
		day = part1;
		month = part2;
		year = part3;
	} else {
		// default to dd/mm/yy
		day = part1;
		month = part2;
		year = part3;
	}
	if (year.length === 2) {
		year = "20" + year;
	}

	return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
};

const processGeoJson = (json) => {
	var mapdata = {
		type: "FeatureCollection",
		features: [],
	};
	let groupName;
	var geoJSONData = JSON.parse(json);

	if (geoJSONData.type === "FeatureCollection") {
		mapdata.features = mapdata.features.concat(geoJSONData.features);

		if (geoJSONData.name) groupName = geoJSONData.name;
	}
	return [mapdata, groupName];
};

const cleanMsgContent = (content, location, imgFileRegex) => {
	// replace the edited message marker since it's attached to other content
	content = content.replace(/<This message was edited>/gi, "").trim();
	// Clean remaining content by removing images and location references
	content = content
		.split("\n")
		.map((line) => {
			// go line by line, remove whitespace and remove images and location references, replacing with a placeholder to maintain message structure and organisation
			// placeholder is used to more easily ignore these messages later on (during the map phase) and serves as a template for future artifacts to remove
			// if these are removed the message order is messed up and it's hard to match them up with the correct location and content
			line = line.trim();
			if (location && line.includes(location[0])) {
				// if line contains location, replace with placeholder
				return (location[0] = "\nremove_this_msg\n"); // setting this up for removal later
			}
			if (line.match(imgFileRegex)) {
				// if line contains image reference, replace with placeholder
				return "\nremove_this_msg\n";
			}
			return line;
		})
		.filter(
			(line) =>
				line && // take only non empty lines
				// ignore lines with the following, they aren't included with other content
				!line.includes("image omitted") &&
				!line.includes("<Media omitted>") &&
				!line.includes("This message was deleted") &&
				!line.includes("You deleted this message") &&
				!line.includes(
					"Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them."
				)
		)
		.join("\n");
	content = content.replace(/remove_this_msg\n/g, "");
	content = content.replace(/\n\n\n/g, "\n");
	return content;
};

const processMsgMatches = (messageMatches, imgFileRegex) => {
	// Process each message match, extracting the sender, location and img filenames before cleaning
	// this returns an array of messages
	let messages = [];
	let senders = {};
	messageMatches.forEach((match) => {
		let message = {
			datetime: formatDateString(match[1], match[2]),
			sender: match[3],
			content: match[4],
		};
		// If sender hasn't been seen before, select a colour for them
		if (!Object.keys(senders).includes(message.sender)) {
			senders[message.sender] = getSenderColour(senders);
		}
		var location = locationRegex.exec(message.content);
		if (location) {
			message.location = {
				lat: parseFloat(location[1]),
				long: parseFloat(location[2]),
			};
		}
		let imgFileMatches = [...message.content.matchAll(imgFileRegex)];
		if (imgFileMatches.length > 0) {
			let imgMatches = [];
			for (const match of imgFileMatches) {
				imgMatches.push(match[1]);
			}
			message.imgFilenames = imgMatches;
		}
		message.content = cleanMsgContent(message.content, location, imgFileRegex);
		messages.push(message);
	});
	return [messages, senders];
};

// Regex to match google maps location and capture lat (group 1) and long (group 2)
const locationRegex =
	/https?:\/\/(?:www\.)?maps\.google\.com\/(?:maps\/?\?q=|search\/?\?q=|.*?)?(-?\d+\.\d+),(-?\d+\.\d+)/;

const setImgMsgRegex = (fileType) => {
	let messageRegex;
	let imgFileRegex;
	// Regex matches a single message including newline characters,
	// stopping when new line starts with date or text ends
	// also accounts for if the datetime is wrapped in brackets and has s
	// Capture group 1 = date, group 2 = time, group 3 = sender, group 4 = message content
	// this has been tweaked for each format but gives the same output
	if (fileType.match(/\[\d{2}/)) {
		// iOS format
		// Adjusted regex for iOS to correctly capture date (DD/MM/YYYY), 24-hour time (HH:MM:SS),
		// sender (allowing for spaces), and multi-line message content.
		// The lookahead now specifically checks for the start of a new message line formatted as [DD/MM/YYYY, HH:MM:SS]
		messageRegex =
			/\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}:\d{2})\]\s(.*?):\s(.+?)(?=\n\[\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}:\d{2}\]|Z$)/gs;
		imgFileRegex = /<attached: (\d+-[\w\-_]+\.(?:jpg|jpeg|png|gif))>/gim;
	} else if (fileType.match(/\d{2}\//)) {
		// Android format (UK/Europe)
		messageRegex =
			/(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2})\s-\s([^:]+): (.+?)(?=\n\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s-\s|$)/gs;
		imgFileRegex = /([\w\-_]+\.(?:jpg|jpeg|png|gif))>?/gim;
	} else {
		console.log("Unknown file type, defaulting to Android format");
		messageRegex =
		/(\d{1,4}\/\d{1,2}\/\d{1,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?(?:AM|PM|am|pm))?)?\s-\s(.*?):[\t\f\cK ]((.|\n)*?)(?=(\n\d{1,4}\/\d{1,2}\/\d{1,4})|$)/g;
			// Regex to match and capture image filenames in messages
		imgFileRegex = /\b([\w\-_]*\.(jpg|jpeg|png|gif))\s\(file attached\)/gim;
	}
	return [messageRegex, imgFileRegex];
	
};

const sortMessages = (messages) => {
	// Sort messages by sender, then by datetime
	messages.sort((a, b) => {
		// Compare by sender
		if (a.sender > b.sender) {
			return 1;
		} else if (a.sender < b.sender) {
			return -1;
		} else {
			// If sender is the same, compare by datetime
			if (a.datetime > b.datetime) {
				return 1;
			} else if (a.datetime < b.datetime) {
				return -1;
			} else {
				return 0; // Otherwise maintain relative order
			}
		}
	});
	return messages;
};
const worldCapitals = [
	"Kabul", "Tirana", "Algiers", "Andorra la Vella", "Luanda", "Buenos Aires", "Yerevan", "Canberra", "Vienna", "Baku",
	"Nassau", "Manama", "Dhaka", "Bridgetown", "Minsk", "Brussels", "Belmopan", "Porto-Novo", "Thimphu", "Sucre",
	"Sarajevo", "Gaborone", "Brasília", "Bandar Seri Begawan", "Sofia", "Ouagadougou", "Gitega", "Phnom Penh", "Yaoundé", "Ottawa",
	"Praia", "Bangui", "N'Djamena", "Santiago", "Beijing", "Bogotá", "Moroni", "Kinshasa", "Brazzaville", "San José",
	"Zagreb", "Havana", "Nicosia", "Prague", "Copenhagen", "Djibouti", "Roseau", "Santo Domingo", "Quito", "Cairo",
	"San Salvador", "Malabo", "Asmara", "Tallinn", "Addis Ababa", "Suva", "Helsinki", "Paris", "Libreville", "Banjul",
	"Tbilisi", "Berlin", "Accra", "Athens", "St. George's", "Guatemala City", "Conakry", "Bissau", "Georgetown", "Port-au-Prince",
	"Tegucigalpa", "Budapest", "Reykjavik", "New Delhi", "Jakarta", "Tehran", "Baghdad", "Dublin", "Jerusalem", "Rome",
	"Kingston", "Tokyo", "Amman", "Astana", "Nairobi", "Tarawa", "Pristina", "Kuwait City", "Bishkek", "Vientiane",
	"Riga", "Beirut", "Maseru", "Monrovia", "Tripoli", "Vaduz", "Vilnius", "Luxembourg", "Antananarivo", "Lilongwe"
  ];

const processText = async (text, zipInput = null) => {
    // Clean the text by removing Unicode control characters
    // [U+200E] is LEFT-TO-RIGHT MARK
    // [U+202C] is POP DIRECTIONAL FORMATTING
    text = text.replace(/[\u200E\u202C]/g, '');

    const groupNameRegex = /"([^"]*)"/;
    const groupNameMatches = text.match(groupNameRegex);
    const groupName = groupNameMatches ? groupNameMatches[1] : null;

    // Check the first 3 characters to determine the format; iOS and Android
    const fileType = text.substring(0, 3);
    const [messageRegex, imgFileRegex] = setImgMsgRegex(fileType);

    let messageMatches = [...text.matchAll(messageRegex)];

    // Convert messageMatches to array of JSON objects and then sort
    let [messages, senders] = processMsgMatches(messageMatches, imgFileRegex);
	const shuffledCapitals = [...worldCapitals].sort(() => Math.random() - 0.5);

	const senderToCapital = {};
	const mappingLog = Object.keys(senders).map((sender, i) => {
		const capital = shuffledCapitals[i % shuffledCapitals.length];
		const trimmedSender =
			sender.length >= 4 ? sender.slice(-4) :
			sender.length === 3 ? sender.slice(-3) :
			sender.length === 2 ? sender.slice(-2) :
			sender;
		const observerName = `${capital}-${trimmedSender}`;
		senderToCapital[sender] = observerName;
		return `• ${sender} → ${observerName}`;
	}).join("\n");
	
	console.log("📍 Assigned Capitals to Observers:\n" + mappingLog);
    messages = sortMessages(messages);

    // Now loop through messages to create geojson for each location
    var mapdata = {
        type: "FeatureCollection",
        features: [],
    };
    let currentFeature = null;
    let currentSender = null;

    const createFeature = (message, groupName, contribID) => {
        return {
            type: "Feature",
            properties: {
                contributionid: contribID,
                mainattribute: groupName,
                observations: "",
                observer: senderToCapital[message.sender],
                datetime: message.datetime,
                markerColour: senders[message.sender],
                imgFilenames: [],
            },
            geometry: message.location
                ? {
                        type: "Point",
                        coordinates: [message.location.long, message.location.lat],
                  }
                : null,
        };
    };

    for (const message of messages) {
		// if the content is valid and there is location or different sender, get the current feature or create a new one and push it to mapdata
		// we assign it to a variable to be sure the validated content is used
		// const contribID = await sha256(message.datetime + message.sender); // hash a unique contrib id, this is difficult under more nesting
        const contribID = await sha256(message.datetime + message.sender);
        if (message.location || message.sender !== currentSender) {
            if (currentFeature && currentFeature.geometry) {
                mapdata.features.push(currentFeature);
            }
            currentFeature = createFeature(message, groupName, contribID);
            currentSender = message.sender;
        }

        if (currentFeature) {
            if (message.imgFilenames) {
                currentFeature.properties.imgFilenames.push(...message.imgFilenames);
            }
            currentFeature.properties.observations += message.content + "\n";
        }
    }
	// Push the last message to mapdataz
    if (currentFeature && currentFeature.geometry) {
        mapdata.features.push(currentFeature);
    }

    // Create the zip file
    const zip = new JSZip();

    // Collect all original image filenames
    const imageFilenames = new Set();

    mapdata.features.forEach((feature) => {
        if (feature.properties.imgFilenames) {
            feature.properties.imgFilenames.forEach((name) => imageFilenames.add(name));
        }
    });

    // Create the GeoJSON file
    const geojsonBlob = new Blob([JSON.stringify(mapdata, null, 2)], {
        type: "application/geo+json",
    });
    zip.file("map.geojson", geojsonBlob);

    // Add images from zip input
    if (zipInput) {
        const filenames = Object.keys(zipInput.files);
        const imgFilenames = filenames.filter((f) => imageFilenames.has(f));

        for (const filename of imgFilenames) {
            const fileData = await zipInput.file(filename).async("blob");
            zip.file(filename, fileData);
        }
    }

    // Generate the zip file as a Blob
    const processedChatBlob = await zip.generateAsync({ type: "blob" });

    // Convert the Blob to a File object
    const processedChatFile = new File(
        [processedChatBlob],
        `${groupName || "processed_chat"}.zip`,
        { type: "application/zip" }
    );

    // Return the map data and the processed chat file
    return [mapdata, groupName, processedChatFile];
};
