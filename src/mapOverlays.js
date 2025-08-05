
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./styles/map-etc.css";
import html2canvas from "html2canvas";
import * as JSZip from "jszip";
import { saveAs } from "file-saver"; // Import file-saver for downloading files
import proj4 from "proj4";
import { fromLatLon, toLatLon } from 'utm';
import checkingPwGif from "./images/checkingPw.gif";

import {
    shareIcn,
    closeIcon,
    createIcn,
    premiumIcn,
    imageIcn,
    menuIcon,
    dataIcn,
    uploadIcn,
    chevronUp,
    connectIcon,
    share,
    search,
    exitButtonIcon,
    msgIcon,
    // fa-whatsapp,
} from "./icons";
import { slugify, useClickOutside } from "./utils.js";
import { isMobileOrTablet } from "./main.js";
import { useUserStore } from "./UserContext.jsx";
import { ASK_URL, hasCognito } from "../globals.js";
import { uploadProcessedChat } from "./data_submission.js";
import { uploadImageData } from "./import_images.js";
import { globalProcessedChatFile } from "./import_whatsapp";
// import BurgerMenu from "./BurgerMenu.jsx";
// import { handleConnect } from "./ConnectButton.js";
import { handleSearch } from "./SearchBar.js";
import { importdata, enableDownload } from "./import_whatsapp.js";
import { importdataimages } from "./import_images.js";

import { FilePicker, MainMenu } from "./MainMenu.jsx"; // Adjust the path based on your project structure
// import { createHash } from "crypto";
import { encryptFile, encodePassphrase } from "./encryption.js";
import ReactGA from "react-ga4";




// function ShareBtn({ setOpen }) {
//     const openShareModal = () => setOpen(true);
//     return (
//         <button type="button" className="share" onClick={openShareModal}>
//             {shareIcn}
//         </button>
//     );
// }

// function SubmitBtn() {
//     return (
//         <button type="submit" className="submit">
//             {chevronUp}
//         </button>
//     );
// }

// function Search() {
//     console.log("search clicked......")
//     return (
//         <button type="submit" className="submit">
//             {chevronUp}
//         </button>
//     );
// }

// Loading spinner for uploadPending state
function LoadingSpinner({ text }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}>
            {text}
            <img src={checkingPwGif} alt="loading" style={{ height: '1.2em', verticalAlign: 'middle' }} />
            
        </span>
    );
}

const quality = 0.25; // Set the compression parameter
const compressImageBlob = (blob, quality = 0.25, maxWidth = 300, maxHeight = 300) => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            let { width, height } = img;

            // Calculate new size while maintaining aspect ratio
            const aspectRatio = width / height;
            if (width > maxWidth || height > maxHeight) {
                if (width > height) {
                    width = maxWidth;
                    height = Math.round(maxWidth / aspectRatio);
                } else {
                    height = maxHeight;
                    width = Math.round(maxHeight * aspectRatio);
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (compressedBlob) => {
                    URL.revokeObjectURL(url);
                    
                    resolve(compressedBlob);
                    const ratio = (compressedBlob.size / blob.size).toFixed(2);
                    // console.log(`Compression ratio: ${ratio}`);
                },
                "image/jpeg",
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };

        img.src = url;
    });
};

function InputArea({ setTitle, setPulse, search, currentDataset }) {
    const { t } = useTranslation();
    const [isSubmit, setIsSubmit] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [placeholderValue, setPlaceholderValue] = useState(t("addDescription"));

    const handleSubmit = (e) => {
        e.preventDefault();
        let topic = filterValue;

        currentDataset.features?.forEach((feature) => {
            feature.properties.topic = topic;
        });

        // Create slug from topic and add to dataset
        const slug = slugify(`${currentDataset.slug}-${topic}`);
        currentDataset.slug = slug;

        setTitle(topic);
        setPulse(true);
        setFilterValue("");
        setPlaceholderValue(t("updateDescription"));
        setIsSubmit(false);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setFilterValue(value);
        if (value.length >= 1) setIsSubmit(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent the default behavior of adding a new line
            search(); // Fire the handleSearch function
        }
    };

    return (
        <form className="filter__form">
            <div
                className="filter__wrapper"
                style={{
                    width: isMobileOrTablet() ? "80%" : "25%",
                }}
            >
                <textarea
                    placeholder={placeholderValue}
                    name="filter"
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown} // Add the onKeyDown event listener
                    value={filterValue}
                ></textarea>

                <button id="search" type="button" onClick={search}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <path
                            d="M22 22L16 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>

            <div className="filter__suggested-tags">
                <button type="button" onClick={search}>Water</button>
                <button type="button" onClick={search}>Population</button>
                <button type="button" onClick={search}>Football</button>
            </div>
        </form>
    );
}


export function MapActionArea({
    setTitle,
    setPulse,
    showMenu,
    currentDataset,
    search,
    share,
    connect,
    create,
    showWaMappers,
    setShowWaMappers,
    ...dataDisplayProps // Add this to capture the props
}) {
    const [isBMVisible, setIsBMVisible] = useState(false); // Define the state for BurgerMenu visibility
    const [isModalOpen, setIsModalOpen] = useState(false); // State for the share modal
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // State for the search modal
    const [isPremium, setIsPremium] = useState(false); // State to differentiate between Search and Premium
    const [isRegisterMapper, setIsRegisterMapper] = useState(false); // State for "register as a mapper"
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for the "Create" modal

    // const [showWaMappers, setShowWaMappers] = useState(false);

    // const toggleBM = () => {
    //     setIsBMVisible((prevState) => !prevState);
    // };

    const handleConnect = () => {
        setIsRegisterMapper(true); // Set the modal content to "register as a mapper"
        setIsSearchModalOpen(true); // Open the search modal
        setShowWaMappers(!showWaMappers); // Toggle the WhatsApp Mappers state
    };

    const handleShare = () => {
        setIsModalOpen(true); // Opens the share modal
        setIsPremium(false); // Set to "Premium" mode

    };

    const handleSearch = () => {
        setIsSearchModalOpen(true); // Opens the search modal
        setIsPremium(false); // Reset isPremium to false

    };

    const handlePremium = () => {
        setIsPremium(true); // Set to "Premium" mode
        setIsSearchModalOpen(true); // Opens the search modal
    };

    const handleCreate = () => {
        setIsCreateModalOpen(true); // Open the "Create" modal
        console.log("create modal clicked")
    };

    return (
        <div id="map-actions-container">
            <div className="map-actions__wrapper">
                <div className="map-actions__body">
                    <InputArea
                        setTitle={setTitle}
                        setPulse={setPulse}
                        currentDataset={currentDataset}
                        search={handleSearch}
                    />
                    <div className="map-actions__buttons">
                        {/* Connect Button */}
                        <button
                            id="connect"
                            type="button"
                            onClick={handleConnect}
                            className="map-action-btn"
                        >
                            <div className="map-action-icon">{connectIcon}</div>
                            <span className="map-action-label" style={{ color: "#3a3a3a", }}>Connect</span>
                        </button>

                        {/* Create Button */}
                        <button
                            id="create"
                            type="button"
                            onClick={handleCreate}
                            className="map-action-btn"
                        >
                            <div className="map-action-icon">{createIcn}</div>
                            <span className="map-action-label" style={{ color: "#3a3a3a", }}>Create</span>
                        </button>
                        {/* Share Button */}
                        <button
                            id="share"
                            type="button"
                            onClick={handleShare}
                            className="map-action-btn"
                        >
                            <div className="map-action-icon">{shareIcn}</div>
                            <span className="map-action-label" style={{ color: "#3a3a3a", }}>Share</span>
                        </button>


                    </div>
                    {(!isMobileOrTablet()) && (
                        <button
                            id="premium"
                            type="button"
                            onClick={handlePremium}
                            className="map-action-btn premium-btn"
                        >
                            <div className="map-action-icon">{premiumIcn}</div>
                            <span className="map-action-label" style={{ color: "#3a3a3a", }}>Premium</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
                currentDataset={currentDataset}
                {...dataDisplayProps} // Pass the props here

            />

            {/* Search Modal */}
            <SearchModal
                isOpen={isSearchModalOpen}
                setIsOpen={setIsSearchModalOpen}
                isPremium={isPremium} // Pass the isPremium state here
                setIsPremium={setIsPremium} // Pass the setIsPremium function
                isRegisterMapper={isRegisterMapper} // Pass the new state
                setIsRegisterMapper={setIsRegisterMapper} // Pass the setter
            />

            {/* Create Modal */}
            <CreateModal
                isOpen={isCreateModalOpen}
                setIsOpen={setIsCreateModalOpen}

            />

        </div>
    );
}
export function CreateModal({ isOpen, setIsOpen }) {
    if (!isOpen) return null;

    const createModalRef = useRef(null);
    const [activeOption, setActiveOption] = useState(null); // Track which option is active: 'whatsapp', 'photos', or null

    useClickOutside(createModalRef, () => setIsOpen(false)); // Close modal when clicking outside

    return (
        <div id="sharing-modal" ref={createModalRef}> {/* Use the same id as ShareModal */}
            <button
                className="modal-close btn"
                onClick={() => setIsOpen(false)}
            >
                {closeIcon}
            </button>
            <div className="modal-title">Create</div> {/* Title */}
            <div className="modal-content">
                {/* Initial three button view */}
                {!activeOption && (
                    <div className="option-button-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            className="btn"
                            onClick={() => setActiveOption('whatsapp')}
                            style={{ height: '45px' }}
                        >
                            WhatsApp Map
                        </button>
                        
                        <button
                            className="btn"
                            onClick={() => setActiveOption('photos')}
                            style={{ height: '45px' }}
                        >
                            Photos Map
                        </button>
                        
                        <button
                            className="btn"
                            onClick={() => {
                                window.open(
                                    "https://wa.me/447473522912?text=Hi,%20I%20would%20like%20to%20register%20as%20WhatsApp%20Mapper.",
                                    "_blank"
                                );
                            }}
                            style={{ height: '45px' }}
                        >
                            Register as Kapta Mapper
                        </button>
                    </div>
                )}
                
                {/* WhatsApp option content */}
                {activeOption === 'whatsapp' && (
                    <>
                        <p>Create WhatsApp Maps with Kapta in 3 simple steps:</p>
                        <ol>
                            <li>Share locations in a WhatsApp Group</li>
                            <li>Export chat to Kapta app</li>
                            <li>Share your WhatsApp Map</li>
                        </ol>
                        
                        <div className="option-button-container">
                            <button
                                className="btn"
                                onClick={() =>
                                    window.open(
                                        "https://wa.me/447473522912?text=Hi%2C%20please%20help%20me%20create%20a%20WhatsApp%20Map.",
                                        "_blank"
                                    )
                                }
                            >
                                Open WhatsApp to start
                            </button>

                            {!isMobileOrTablet() && (
                                <>
                                    <p>Or if you already have the chat. Upload to convert it.</p>
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            const filePickerButton = document.getElementById("filePickerButton");
                                            filePickerButton?.click();
                                            setIsOpen(false); // Close the "Create" modal

                                            // Clear the /?import=... in the URL
                                            const url = new URL(window.location.href);
                                            url.searchParams.delete("import"); // Remove the "import" query parameter
                                            window.history.replaceState({}, document.title, url.toString()); // Update the URL without reloading
                                        }}
                                    >
                                        Convert a chat<br />into a map
                                    </button>
                                </>
                            )}
                            
                            {/* Back button */}
                             <button 
                                className="btn" 
                                onClick={() => setActiveOption(null)}
                                style={{ marginTop: '10px', height: '35px', width: '85px', backgroundColor: 'transparent' } }
                            >
                                Go back
                            </button>
                        </div>
                    </>
                )}
                
                {/* Photos option content */}
                {activeOption === 'photos' && (
                    <>
                        <p>To create a Photos Map, select image files from your device.</p>
                        <p>Note that only the images that were taken with the "Location" ON in your device will be shown in the map.</p>
                        
                        <div className="option-button-container">
                            <button
                                className="btn"
                                onClick={() => {
                                    // Get the filePickerButton, but modify it to only accept images
                                    const fileInput = document.querySelector('input[type="file"]');
                                    const originalAccept = fileInput.accept;
                                    // Force it to only accept images
                                    fileInput.accept = "*/*";
                                    fileInput.multiple = true;
                                    
                                    const filePickerButton = document.getElementById("filePickerButton");
                                    filePickerButton?.click();
                                    setIsOpen(false); // Close the "Create" modal

                                    // Clear the /?import=... in the URL
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete("import"); // Remove the "import" query parameter
                                    window.history.replaceState({}, document.title, url.toString()); // Update the URL without reloading
                                    
                                    // Reset the accept attribute after dialog opens
                                    setTimeout(() => {
                                        fileInput.accept = originalAccept;
                                    }, 1000);
                                }}
                            >
                                Convert images into a map
                            </button>
                            
                            {/* Back button */}
                            <button 
                                className="btn" 
                                onClick={() => setActiveOption(null)}
                                style={{ marginTop: '10px', height: '35px', width: '85px', backgroundColor: 'transparent' } }
                            >
                                Go back
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
export function SearchModal({ isOpen, setIsOpen, isPremium, isRegisterMapper, setIsRegisterMapper }) {
    if (!isOpen) return null;

    const searchModalRef = useRef(null);

    useClickOutside(searchModalRef, () => {
        setIsOpen(false);
        setIsRegisterMapper(false); // Reset the state when the modal is closed
    });

    return (
        <div id="search-modal" ref={searchModalRef}>
            <button
                className="modal-close btn"
                onClick={() => {
                    setIsOpen(false);
                    setIsRegisterMapper(false); // Reset the state
                }}
            >
                {closeIcon}
            </button>
            <div className="modal-title">
                {isRegisterMapper
                    ? "Connect"
                    : isPremium
                        ? "Premium"
                        : "Search"}
            </div>
            <div className="modal-content">
                {isRegisterMapper ? (
                    <>
                        <p>
                            {/* Zoom out if you can't find WhatsApp Mappers in this area.
                <br />
                Or register yourself or others as WhatsApp Mappers. Once registered, anyone can contact you to pay you for creating a WhatsApp Map.<br /> 
                We recommend you to create a WhatsApp Business account to show your profile.
                <br />
                <br />
                To register, all you need to do is send us a WhatsApp message 👇 */}
                        </p>
                        <div className="option-button-container">

                            {/* <button
                    className="btn"
                    onClick={() => setIsOpen(false)}>

                    Connect with<br />mappers in the map
                </button> */}
                            <p>Explore the map to connect with Kapta Business Mappers. For a large-scale crowdsoucing campaign, go to "Premium".
                            </p>
                            <button
                                className="btn"
                                style={{ height: "45px", borderRadius: "15px" }}
                                onClick={() => {
                                    window.open(
                                        "https://wa.me/447473522912?text=Hi%2C%20I%20need%20WhatsApp%20Maps%20about...",
                                        "_blank"
                                    );
                                }}
                            >
                                Contact us
                            </button>
                        </div>
                    </>
                ) : isPremium ? (
                    <>
                        <p>
                            {/* You can task WhatsApp Business Mappers that you already know or you can "Connect" with WhatsApp Mappers — their number is in the pop-up. The free plan allows you to receive the maps and store them locally and visualize them in Kapta Lite. */}
                            <br />
                            The <strong>free version</strong> allows you to visualise the maps in Kapta and download the data to analyse it in QGIS, ArcGIS etc.
                            <br />
                            <strong>Premium</strong> allows you to manage multiple WhatsApp Maps and use dashboards and AI Agents for advanced visualisation and analysis.

                        </p>
                        <div className="option-button-container">
                            <button
                                className="btn"
                                onClick={() => {
                                    window.open("https://forms.gle/Br6C8eAueZdo35Y7A", "_blank");
                                }}
                            >
                                Request a Premium Demo
                            </button>
                        </div>

                    </>
                ) : (
                    <p>No open WhatsApp Maps have been shared yet. Contribute yours!</p>
                )}
            </div>

        </div>
    );
}

export function ShareModal({
    isOpen,
    setIsOpen,
    currentDataset,
    setIsUploadDialogOpen,
    dataset,
    ...dataDisplayProps
}) {

    // console.log("ShareModalclick", dataDisplayProps);
    if (!isOpen) return null;
    
    // Helper function to check if we're dealing with image data
    const checkIsImageData = () => dataDisplayProps.dataset && dataDisplayProps.dataset.isImageData;
    
    const shareModalRef = useRef(null);
    const { t } = useTranslation();
    const [sharingOption, setSharingOption] = useState("private-non-sensitive"); // Default to Private
    const [hasTaskId, setHasTaskId] = useState(null);
    const [taskId, setTaskId] = useState("");
    const [mapperId, setMapperId] = useState(""); // New state for Mapper ID
    const [buttonText, _setButtonText] = useState(t("sharedata"));
    const setButtonText = translationKey => _setButtonText(t(translationKey));
    const [isButtonDisabled, setButtonDisabled] = useState(false);
    const [kaptaWaMapUrl, setKaptaWaMapUrl] = useState(""); // Store the generated URL
    const [WhatsAppMapTags, setWhatsAppMapTags] = useState(""); // New state for map description
    const [showMapperIdField, setShowMapperIdField] = useState(false); // New state for showing Mapper ID field
    const [password, setPassword] = useState(""); // State for encryption password
    const [passwordError, setPasswordError] = useState(""); // State for password validation errors
    const [decryptError, setDecryptError] = useState(""); // State for decryption errors
    const [showPasswordInput, setShowPasswordInput] = useState(false); // Whether to show the password input
    const [showInfoContent, setShowInfoContent] = useState(false); // Whether to show info content
    const [showTaskIdUpload, setShowTaskIdUpload] = useState(false); // Whether to show task ID upload interface
    const [taskIdInput, setTaskIdInput] = useState(""); // Task ID input value

    const handleShareDataClick = async () => {
        // Reset any previous errors
        setDecryptError("");
        
        // If the URL is already generated, handle re-click behavior
        if (kaptaWaMapUrl) {
            if (navigator.canShare && navigator.share) {
                navigator
                    .share({
                        title: "#MadeWithKapta",
                        text: `This is a Private Map created with Kapta. 🔐 The password to open it is: ${password}`,
                        url: kaptaWaMapUrl,
                    })
                    .catch((error) => console.error("Sharing failed", error));
            } else {
                navigator.clipboard
                    .writeText(kaptaWaMapUrl)
                    .then(() => {
                        alert("Link copied to clipboard!");
                    })
                    .catch((err) => {
                        console.error("Failed to copy link: ", err);
                    });
            }
            return;
        }

        // Check password is valid
        if (!password) {
            setPasswordError("Please enter a password");
            return;
        }
        
        if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        // Generate the URL if it hasn't been generated yet
        setButtonText("uploadPending");
        setButtonDisabled(true);

        function generateBase62Id(length = 32) {
            const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            const charsetLength = charset.length;
            const values = new Uint8Array(length);
            crypto.getRandomValues(values);

            return Array.from(values)
                .map(byte => charset[byte % charsetLength])
                .join("");
        }
        const randomNum = generateBase62Id(); // Generate a random string of 20 characters
        console.log("🔐 Base62 ID:", randomNum)
        const fileNameWAMap = `KaptaWhatsAppMap-${randomNum}`; //Reduce parameters to increase security of URL

        try {
            // Compress images in the zip file before uploading
            let globalProcessedChatFileReduced = null;

            if (globalProcessedChatFile) {
                const zip = await JSZip.loadAsync(globalProcessedChatFile);
                const filenames = Object.keys(zip.files);

                const compressionPromises = filenames.map(async (filename) => {
                    const file = zip.file(filename);
                    if (file && /\.(jpg|jpeg|png|gif)$/i.test(filename)) {
                        const fileData = await file.async("blob");
                        const compressedBlob = await compressImageBlob(fileData, quality);
                        if (compressedBlob) {
                            zip.file(filename, compressedBlob);
                        }
                    }
                });

                await Promise.all(compressionPromises);

                // Generate the updated zip file
                const updatedZipBlob = await zip.generateAsync({ type: "blob" });
                globalProcessedChatFileReduced = new File(
                    [updatedZipBlob],
                    globalProcessedChatFile.name,
                    { type: "application/zip" }
                );
                
                // Always apply encryption
                if (password) {
                    try {
                        console.log("Encrypting file with password...");
                        
                        // Track encryption event
                        ReactGA.event({
                            category: "Encryption",
                            action: "Map Encrypted",
                        });
                        
                        const encryptedBlob = await encryptFile(globalProcessedChatFileReduced, password);
                        globalProcessedChatFileReduced = new File(
                            [encryptedBlob],
                            globalProcessedChatFile.name,
                            { type: "application/encrypted" }
                        );
                    } catch (error) {
                        console.error("Encryption error:", error);
                        setDecryptError("Failed to encrypt the map. Please try again.");
                        return;
                    }
                }
            }

            // Check if we're handling image data or WhatsApp chat data
            let presignedUrl;
            
            if (checkIsImageData()) {
                // Use uploadImageData for image data
                presignedUrl = await uploadImageData(
                    dataDisplayProps.dataset.data,
                    sharingOption,
                    taskId,
                    WhatsAppMapTags,
                    mapperId,
                    setButtonText,
                    setButtonDisabled
                );
            } else {
                // Use uploadProcessedChat for WhatsApp chat data
                presignedUrl = await uploadProcessedChat(
                    globalProcessedChatFileReduced,
                    fileNameWAMap,
                    setButtonText,
                    setButtonDisabled,
                    sharingOption,
                    taskId,
                    WhatsAppMapTags,
                    mapperId
                );
            }

            // Generate URL without passphrase in it
            let generatedUrl = `https://staging.d1260g649u28p8.amplifyapp.com/?import=${presignedUrl}`;
            
            setKaptaWaMapUrl(generatedUrl); // Store the generated URL
            setButtonText("shareDirectly");
            setButtonDisabled(false);

            // Prepare share message text
            let shareTitle = "#MadeWithKapta";
            let shareText;
            
            // Choose appropriate message text based on data type
            // Always include password in the share message with a lock and key emoji
            shareText = checkIsImageData()
                ? `This is a Private Map created with Kapta. 🔐 The password to open it is: ${password}`
                : `This is a Private Map created with Kapta. 🔐 The password to open it is: ${password}`;

            // Handle sharing
            if (navigator.canShare && navigator.share) {
                navigator
                    .share({
                        title: shareTitle,
                        text: shareText,
                        url: generatedUrl,
                    })
                    .catch((error) => console.error("Sharing failed", error));
            } else {
                // Prepare clipboard content and message
                let clipboardContent, alertMessage;
                
                // Always include password in the clipboard content
                clipboardContent = `📍 WhatsApp Map Link: ${generatedUrl}`;
                
                alertMessage = `Map link copied to clipboard! 
                            
� IMPORTANT: Your map is private.
🔑 Password: ${password}

(The map can only be accessed with this password)`;
                
                // Copy to clipboard
                navigator.clipboard
                    .writeText(clipboardContent)
                    .then(() => {
                        alert(alertMessage);
                    })
                    .catch((err) => {
                        console.error("Failed to copy link: ", err);
                    });
            }
        } catch (error) {
            console.error("Error during sharing:", error);
            if (error.message?.includes("decrypt")) {
                setDecryptError("Incorrect password. Please try again.");
            } else {
                setButtonText("sharedata");
                setButtonDisabled(false);
            }
        }
    };

    const handleTaskIdUpload = async () => {
        // Check if task ID is provided
        if (!taskIdInput || taskIdInput.trim() === "") {
            alert("Please enter a Task ID before uploading.");
            return;
        }

        setButtonText("uploadPending");
        setButtonDisabled(true);

        try {
            // Check if we're handling image data or WhatsApp chat data
            if (checkIsImageData()) {
                // Use uploadImageData for image data with the task ID
                await uploadImageData(
                    dataDisplayProps.dataset.data,
                    "private-non-sensitive", // Default sharing option for task ID uploads
                    taskIdInput.trim(),
                    WhatsAppMapTags,
                    mapperId,
                    setButtonText,
                    setButtonDisabled
                );
            } else {
                // Use uploadProcessedChat for WhatsApp chat data with the task ID
                await uploadProcessedChat(
                    globalProcessedChatFile,
                    `TaskID_${taskIdInput.trim()}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
                    setButtonText,
                    setButtonDisabled,
                    "private-non-sensitive", // Default sharing option for task ID uploads
                    taskIdInput.trim(),
                    WhatsAppMapTags,
                    mapperId
                );
            }

            setButtonText("Upload Complete");
            setButtonDisabled(false);
            alert(`Map successfully uploaded with Task ID: ${taskIdInput.trim()}`);
            
        } catch (error) {
            console.error("Error during task ID upload:", error);
            setButtonText("Upload with Task ID");
            setButtonDisabled(false);
            alert("Upload failed. Please try again.");
        }
    };

    const handleDownload = () => {
        console.log(globalProcessedChatFile)
        if (globalProcessedChatFile) {
            const blob = new Blob([globalProcessedChatFile], {
                type: "application/zip",
            });
            function getDateTime() {
                const now = new Date();
                const datePart = now.toISOString().split("T")[0]; // YYYY-MM-DD
                const timePart = now
                    .toTimeString()
                    .split(" ")[0]     // HH:MM:SS
                    .replace(/:/g, "-"); // Replace colons with hyphens
                return `${datePart}_${timePart}`; // YYYY-MM-DD_HH-MM-SS
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const dateTime = getDateTime();
            // Use different filename for image data vs WhatsApp map
            link.download = checkIsImageData() 
                ? `Kapta_Private_Map_${dateTime}.zip` 
                : `Kapta_Private_Map_${dateTime}.zip`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };
    const handleShareCurrentUrl = () => {

        const shareText = checkIsImageData() 
            ? "This is a Private Map created with Kapta" 
            : "This is a Private Map created with Kapta";
        const alertText = checkIsImageData() 
            ? "The Private Map link has been copied to clipboard!" 
            : "The Private Map link has been copied to clipboard!";
            
        if (navigator.canShare && navigator.share) {
            navigator
                .share({
                    title: "#MadeWithKapta",
                    text: shareText,
                    url: window.location.href,
                })
                .catch((error) => console.error("Sharing failed", error));
        } else {
            navigator.clipboard
                .writeText(window.location.href)
                .then(() => {
                    alert(alertText);
                })
                .catch((err) => {
                    console.error("Failed to copy link: ", err);
                });
        }
    }
// Converts decimal degrees to Degrees Minutes Seconds (DMS)
function toDMS(decimal, isLatitude) {
    const absolute = Math.abs(decimal);
    let degrees = Math.floor(absolute);
    let minutes = Math.floor((absolute - degrees) * 60);
    let seconds = Math.round((((absolute - degrees) * 60) - minutes) * 60);

    // Adjust if rounding resulted in 60 seconds
    if (seconds === 60) {
        minutes++;
        seconds = 0;
    }
    // Adjust if minutes reach 60 after rounding
    if (minutes === 60) {
        degrees++;
        minutes = 0;
    }

    const direction = isLatitude 
        ? (decimal >= 0 ? "N" : "S") 
        : (decimal >= 0 ? "E" : "W");
        
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
}

// Function to generate CSV and trigger download
const generateCSV = (dataset) => {
    const headers = [
        "latitude",
        "longitude",
        "latitude (DMS)",
        "longitude (DMS)",
        "UTM Zone",
        "UTM Coordinates",
        "image ID",
        "date",
        "observer",
        "observation",
    ];

    // Helper to safely escape CSV values
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '""';
        return `"${value.toString().replace(/"/g, '""')}"`;
    };

    const rows = dataset.features.map((feature) => {
        const { coordinates } = feature.geometry || {};
        const { imgFilenames, datetime, observer, observations } = feature.properties || {};

        const latDMS = coordinates ? toDMS(coordinates[1], true) : "";
        const lngDMS = coordinates ? toDMS(coordinates[0], false) : "";

        // Convert latitude/longitude to UTM using named import from 'utm'
        const utmData = coordinates ? fromLatLon(coordinates[1], coordinates[0]) : {};
        const utmZone = utmData.zoneNum ? `${utmData.zoneNum}${utmData.zoneLetter}` : "";
        const utmCoordinates = utmData.easting
            ? `${utmData.easting.toFixed(2)}, ${utmData.northing.toFixed(2)}`
            : "";

        return [
            coordinates ? coordinates[1] : "",             // latitude
            coordinates ? coordinates[0] : "",             // longitude
            latDMS,                                        // latitude in DMS
            lngDMS,                                        // longitude in DMS
            utmZone,                                       // UTM Zone
            utmCoordinates,                                // UTM Coordinates
            imgFilenames ? imgFilenames.join(";") : "",     // image ID(s)
            datetime || "",                                // date
            observer || "",                                // observer
            observations || "",                            // observation
        ];
    });

    const csvContent = [headers, ...rows]
        .map((row) => row.map((value) => escapeCSV(value)).join(","))
        .join("\n");

  
    function getDateTime() {
        const now = new Date();
        const datePart = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const timePart = now
            .toTimeString()
            .split(" ")[0]     // HH:MM:SS
            .replace(/:/g, "-"); // Replace colons with hyphens
        return `${datePart}_${timePart}`; // YYYY-MM-DD_HH-MM-SS
    }

    // Example usage in the CSV download file name:
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const dateTime = getDateTime();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kapta_WhatsApp_Map_${dateTime}.csv`; // File name now includes date and time
    link.click();
    URL.revokeObjectURL(url);
};

    useClickOutside(shareModalRef, () => setIsOpen(false));

    return (

        <div id="sharing-modal" ref={shareModalRef}>
            <button className="modal-close btn" onClick={() => setIsOpen(false)}>
                {closeIcon}
            </button>
            <div className="modal-title">
                {"Share"}
            </div>

            {(importdata || importdataimages || window.location.href.includes("import=")) ? (
                <>
                    {/* Open WhatsApp Map Section */}
                    <section className="modal-section" style={{ textAlign: "center" }}>
                        <div
                            className="checkbox-container"
                            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}
                        >
                             
                            {showPasswordInput && (
                                <div style={{ marginBottom: "-15px" }}>
                                    <div style={{ 
                                        border: "0px solid #25D366", 
                                        borderRadius: "8px", 
                                        padding: "10px", 
                                        marginTop: "5px",
                                        backgroundColor: "transparent",
                                        // boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                                    }}>
                                        <label style={{ 
                                            fontSize: "1rem", 
                                            fontWeight: "bold",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: "#333"
                                        }}>
                                            
                                        </label>
                                        
                                        <p style={{ 
                                            fontSize: "0.95rem", 
                                            margin: "5px 0",
                                            color: "black",
                                            lineHeight: "1.3"
                                        }}>
                                            Create a password for your map 🔐 
                                        </p>
                                        
                                        <div style={{ marginTop: "8px" }}>
                                            <div style={{ marginBottom: "5px" }}>
                                                <input
                                                    type="password"
                                                    placeholder="Create password"
                                                    value={password}
                                                    onChange={(e) => {
                                                        setPassword(e.target.value);
                                                        setPasswordError("");
                                                        setDecryptError(""); // Clear decrypt error when typing
                                                    }}
                                                    style={{ 
                                                        width: "80%", 
                                                        padding: "10px", 
                                                        margin: "0 auto 8px auto",
                                                        border: (passwordError || decryptError) ? "1px solid red" : "1px solid #25D366",
                                                        borderRadius: "4px",
                                                        outline: "none",
                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                            {(passwordError || decryptError) && (
                                                <p style={{ 
                                                    color: "#e74c3c", 
                                                    fontSize: "0.8rem", 
                                                    marginTop: "4px",
                                                    marginBottom: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "5px"
                                                }}>
                                                    <span>⚠️</span> {passwordError || decryptError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                          
                        </div>

                    </section>

                 
                    {!showTaskIdUpload && !showPasswordInput ? (
                        <>
                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        if(!window.location.href.includes("import=")){
                                            // Show password input and hide other buttons
                                            setShowPasswordInput(true);
                                        }else if(window.location.href.includes("import=")){
                                            handleShareCurrentUrl()
                                        }      
                       
                                    }}
                                    style={{ 
                                        height: "40px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: "#25D366",
                                        fontWeight: "500"
                                    }}
                                >
                                    Share Map link
                                </button>
                            </div>

                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => setShowTaskIdUpload(true)}
                                    style={{ 
                                        height: "40px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: "#ffc107",
                                        fontWeight: "500"
                                    }}
                                >
                                    Upload with taskID
                                </button>
                            </div>

                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button 
                                    className="btn" 
                                    onClick={handleDownload}
                                    style={{ 
                                        height: "36px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center" 
                                    }}
                                >
                                    {/* Download {dataDisplayProps.dataset && dataDisplayProps.dataset.isImageData ? "Geotagged Images" : "WhatsApp Map"} */}
                                    Download Map
                                </button>
                            </div>
                        
                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => generateCSV(currentDataset)}
                                    style={{ 
                                        height: "36px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center" 
                                    }}
                                >
                                    Download CSV file
                                </button>
                            </div>
                        </>
                    ) : showPasswordInput && !showTaskIdUpload ? (
                        <>
                            {/* Share Map Link Interface with Password Input */}
                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        // Proceed with sharing
                                        handleShareDataClick();
                                    }}
                                    style={{ 
                                        height: "40px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: "#25D366",
                                        fontWeight: "500"
                                    }}
                                >
                                    {buttonText === "uploadPending"
                                        ? <LoadingSpinner text="Encrypting & Uploading" />
                                        : buttonText
                                    }
                                </button>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setShowPasswordInput(false);
                                        setPassword("");
                                        setPasswordError("");
                                        setDecryptError("");
                                        setButtonText("sharedata");
                                        setButtonDisabled(false);
                                    }}
                                    style={{ 
                                        height: "36px", 
                                        width: "80px",
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: "#e9ecef",
                                        color: "#495057"
                                    }}
                                >
                                    ← Back
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Task ID Upload Interface */}
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={{ 
                                        fontSize: "1rem", 
                                        fontWeight: "bold",
                                        display: "block",
                                        marginBottom: "5px",
                                        color: "#333"
                                    }}>
                                        Enter Task ID:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your task ID"
                                        value={taskIdInput}
                                        onChange={(e) => setTaskIdInput(e.target.value)}
                                        style={{ 
                                            width: "90%", 
                                            padding: "10px", 
                                            border: "1px solid #007bff",
                                            borderRadius: "4px",
                                            outline: "none",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                        }}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="option-button-container" style={{ marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={handleTaskIdUpload}
                                    disabled={!taskIdInput || taskIdInput.trim() === "" || isButtonDisabled}
                                    style={{ 
                                        height: "40px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: (!taskIdInput || taskIdInput.trim() === "" || isButtonDisabled) ? "#ccc" : "#ffc107",
                                        fontWeight: "500",
                                        cursor: (!taskIdInput || taskIdInput.trim() === "" || isButtonDisabled) ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {buttonText === "uploadPending" ? <LoadingSpinner text="Uploading..." /> : "Click here to upload"}
                                </button>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setShowTaskIdUpload(false);
                                        setTaskIdInput("");
                                        setButtonText("sharedata");
                                        setButtonDisabled(false);
                                    }}
                                    style={{ 
                                        height: "36px", 
                                        width: "80px",
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        backgroundColor: "#e9ecef",
                                        color: "#495057"
                                    }}
                                >
                                    ← Back
                                </button>
                            </div>
                        </>
                    )}
                    
                    {showInfoContent && (
                        <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                            <div style={{ fontSize: "0.8rem", lineHeight: "1.4", color: "#555" }}>
                                <p style={{ marginBottom: "6px" }}>Kapta Lite is a privacy-focused tool for sharing WhatsApp Maps. All maps are password-protected by default with the following security features:</p>
                                <ul style={{ paddingLeft: "18px", marginTop: "6px", marginBottom: "8px" }}>
                                    <li>Client-side encryption using AES-256. Not even the Kapta team can view your maps.</li>
                                    <li>Passwords never stored on our servers</li>
                                    {/* <li>Files automatically expire after 30 days</li> */}
                                    <li>No user registration or personal data collection</li>
                                </ul>
                                <p style={{ marginBottom: "4px" }}>Download buttons</p>
                                <ul style={{ paddingLeft: "18px", marginTop: "5px", marginBottom: "8px" }}>
                                    <li>The CSV file contains the coordinates and other map information</li>
                                    <li>The Map file contains the map data in geoJSON format and the images. To view the map in Kapta, select the zip file, then click 'Share' and select Kapta.</li>
                                    <li>The Map data can directly be imported into QGIS or ArcGIS or other GIS software.</li>
                                    <li>If you need help to process the map data, feel free to reach out to us.</li>
                                </ul>
                                <p style={{ marginTop: "8px", marginBottom: "0" }}>Choose a strong password (minimum 6 characters. 12 recommended) and share it separately from the map link for maximum security.</p>
                            </div>
                            <div style={{ textAlign: "right", marginTop: "15px" }}>
                                {/* <button 
                                    onClick={() => setShowInfoContent(false)}
                                    style={{
                                        backgroundColor: "#25D366",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "8px 16px",
                                        fontSize: "0.9rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    Back to sharing options
                                </button> */}
                            </div>
                        </div>
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                        <button 
                            onClick={() => setShowInfoContent(!showInfoContent)}
                            style={{
                                width: "100px",
                                height: "26px",
                                borderRadius: "13px",
                                backgroundColor: "#525553ff",
                                color: "white",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            {showInfoContent ? "Hide info" : "More info"}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    
                        <div className="modal-content">
                            <p style={{ textAlign: "center" }}>
                                You need to create or load a Map before you can share it!
                            </p>
                        </div>

                </>
            )}
        </div>
    );
}

