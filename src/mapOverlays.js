import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./styles/map-etc.css";
import html2canvas from "html2canvas";
import * as JSZip from "jszip";

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
import { globalProcessedChatFile } from "./import_whatsapp";
// import BurgerMenu from "./BurgerMenu.jsx";
// import { handleConnect } from "./ConnectButton.js";
import { handleSearch } from "./SearchBar.js";
import { importdata, enableDownload } from "./import_whatsapp.js";
import { FilePicker, MainMenu } from "./MainMenu.jsx"; // Adjust the path based on your project structure
// import { createHash } from "crypto";




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
const quality = 0.2; // Set the compression parameter
const compressImageBlob = (blob, quality) => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
                (compressedBlob) => {
                    URL.revokeObjectURL(url);
                    resolve(compressedBlob);
                },
                "image/jpeg",
                quality
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null); // Skip on error
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

    useClickOutside(createModalRef, () => setIsOpen(false)); // Close modal when clicking outside

    return (
        <div id="sharing-modal" ref={createModalRef}> {/* Use the same id as ShareModal */}
            <button
                className="modal-close btn"
                onClick={() => setIsOpen(false)}
            >
                {closeIcon}
            </button>
            <div className="modal-title">Create WhatsApp Map</div> {/* Title */}
            <div className="modal-content">
                <p>Create WhatsApp Maps with Kapta in 3 simple steps:</p>
                <ol>
                    <li>Share locations in a<br />WhatsApp Group</li>
                    <li>Export chat to<br />Kapta Lite app</li>
                    <li>Share your<br />WhatsApp Map</li>
                </ol>
                {!isMobileOrTablet() && (
                    <p>Or if you already have the chat. Upload to convert it.</p>
                )}
                <div className="option-button-container">
                    <button
                        className="btn"
                        onClick={() =>
                            window.open("https://youtu.be/cE30c18ipfU", "_blank")
                        }
                    >
                        Watch Tutorial
                    </button>
                    <button
                        className="btn"
                        onClick={() =>
                            window.open(
                                "https://wa.me/447473522912?text=Hi%2C%20please%20help%20me%20create%20a%20WhatsApp%20Map.",
                                "_blank"
                            )
                        }
                    >
                        Contact us
                    </button>
                    <p style={{ marginTop:"-5px", textAlign: "center" }}>Not yet registered as WhatsApp Business Mapper?</p>
                    <button
                    className="btn"
                    style={{ marginTop:"-15px"}}
                    onClick={() => {
                    window.open(
                        "https://wa.me/447473522912?text=Hi,%20I%20would%20like%20to%20register%20as%20WhatsApp%20Mapper.",
                        "_blank"
                    );
                    }}
                >
                    Register
                </button>
                    {!isMobileOrTablet() && (
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
                    )}
                </div>
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
                    ? ""
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
                <p>No mappers? The Kapta team can connect you with mappers in the area</p>
                <button
                    className="btn"
                    style={{ height:"45px", borderRadius:"15px"}}
                    onClick={() => {
                    window.open(
                        "https://wa.me/447473522912?text=Hi%2C%20please%20connect%20me%20with%20mappers%20in%20the%20area.%20",
                        "_blank"
                    );
                    }}
                >
                    Send request
                </button>
            </div>
        </>
    ) : isPremium ? (
        <>
            <p>
                {/* You can task WhatsApp Business Mappers that you already know or you can "Connect" with WhatsApp Mappers — their number is in the pop-up. The free plan allows you to receive the maps and store them locally and visualize them in Kapta Lite. */}
                <br />
                To request a demo for advanced data management and visualization, please fill in this form:
            </p>
            <div className="option-button-container">
                <button
                    className="btn"
                    onClick={() => {
                    window.open("https://forms.gle/Br6C8eAueZdo35Y7A", "_blank");
                    }}
                >
                    Request premium demo
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
    const shareModalRef = useRef(null);
    const { t } = useTranslation();
    const [sharingOption, setSharingOption] = useState(null); // Renamed from isOpenMapChecked
    const [hasTaskId, setHasTaskId] = useState(null);
    const [taskId, setTaskId] = useState("");
    const [mapperId, setMapperId] = useState(""); // New state for Mapper ID
    const [buttonText, setButtonText] = useState(t("sharedata"));
    const [isButtonDisabled, setButtonDisabled] = useState(false);
    const [kaptaWaMapUrl, setKaptaWaMapUrl] = useState(""); // Store the generated URL
    const [WhatsAppMapTags, setWhatsAppMapTags] = useState(""); // New state for map description
    const [showMapperIdField, setShowMapperIdField] = useState(false); // New state for showing Mapper ID field

    const handleShareDataClick = async () => {
        if (kaptaWaMapUrl) {
            // If the URL is already generated, handle re-click behavior
            if (navigator.canShare && navigator.share) {
                navigator
                    .share({
                        title: "#MadeWithKapta",
                        text: "This is a WhatsApp Map created with Kapta",
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

        // Generate the URL if it hasn't been generated yet
        setButtonText("Uploading… Wait a few seconds");
        setButtonDisabled(true);
        // const randomNum = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join('');

        // function generateHashedFilename(originalName, salt = "") {
        //     const timestamp = Date.now();
        //     const input = `${originalName}-${salt}`;
        //     const hash = createHash("sha256").update(input).digest("hex");
        //     const extension = originalName.split('.').pop();
        //     return `${hash}.${extension}`;
        //   }
        // const fileName = generateHashedFilename("map.png", "task123", "optionalSecret");
  
        // const date = new Date().toISOString().split("T")[0];
        // const fileNameWAMap = `KaptaWhatsAppMap-${date}-${WhatsAppMapTags.replace(/\s+/g, "_")}-${taskId || "000000"}-${sharingOption || "unknown"}-${randomNum}`;
        
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
        console.log("🔐 Base62 ID:",randomNum)
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
            }

            // Pass the sharingOption and wabMapperId to data_submission
            const presignedUrl = await uploadProcessedChat(
                globalProcessedChatFileReduced,
                fileNameWAMap,
                setButtonText,
                setButtonDisabled,
                sharingOption, // Pass the sharing option
                taskId,
                WhatsAppMapTags,
                mapperId // Pass the Mapper ID as wabMapperId
            );

            const generatedUrl = `https://lite.kapta.earth/?import=${presignedUrl}`;
            setKaptaWaMapUrl(generatedUrl); // Store the generated URL
            setButtonText("Click here to share directly");
            setButtonDisabled(false);

            // Handle sharing
            if (navigator.canShare && navigator.share) {
                navigator
                    .share({
                        title: "#MadeWithKapta",
                        text: "This is a WhatsApp Map created with Kapta",
                        url: generatedUrl,
                    })
                    .catch((error) => console.error("Sharing failed", error));
            } else {
                navigator.clipboard
                    .writeText(generatedUrl)
                    .then(() => {
                        alert("Link copied to clipboard!");
                    })
                    .catch((err) => {
                        console.error("Failed to copy link: ", err);
                    });
            }
        } catch (error) {
            console.error("Error during sharing:", error);
            setButtonText(t("sharedata"));
            setButtonDisabled(false);
        }
    };

    const handleDownload = () => {
        console.log(globalProcessedChatFile)
       if (globalProcessedChatFile) {
    const blob = new Blob([globalProcessedChatFile], {
      type: "application/zip",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    link.download = `Kapta_WhatsApp_Map_${date}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }
    };
    const handleShareCurrentUrl = () => {

        if (navigator.canShare && navigator.share) {
            navigator
                .share({
                    title: "#MadeWithKapta",
                    text: "This is a WhatsApp Map created with Kapta",
                    url: window.location.href,
                })
                .catch((error) => console.error("Sharing failed", error));
        } else {
            navigator.clipboard
                .writeText(window.location.href)
                .then(() => {
                    alert("The WhatsApp Map link has been copied to clipboard!");
                })
                .catch((err) => {
                    console.error("Failed to copy link: ", err);
                });
        }
    }

    useClickOutside(shareModalRef, () => setIsOpen(false));

    return (
        
        <div id="sharing-modal" ref={shareModalRef}>
            <button className="modal-close btn" onClick={() => setIsOpen(false)}>
                {closeIcon}
            </button>
            <div className="modal-title">
                {importdata ? t("sharingTitle") : "Share WhatsApp Map"}
            </div>
    
            {importdata ? (
                <>
                    {/* Open WhatsApp Map Section */}
                    <section className="modal-section" style={{ textAlign: "center" }}>
                        <p style={{ fontWeight: "bold" }}>I want to share this data as:</p>
                        <div
                            className="checkbox-container"
                            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}
                        >
                            <label style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
                                <input
                                    type="checkbox"
                                    style={{ width: "20px", height: "20px" }}
                                    checked={sharingOption === "private-non-sensitive"}
                                    onChange={() => setSharingOption("private-non-sensitive")}
                                />
                                <strong>Private</strong>
                            </label>
                            <p style={{ fontSize: "0.8rem", marginTop: "-8px" }}>
                                (Only people with the link can view)
                            </p>

                            <label style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
                                <input
                                    type="checkbox"
                                    style={{ width: "20px", height: "20px" }}
                                    checked={sharingOption === "open"}
                                    onChange={() => {
                                        setSharingOption("open");
                                        setShowMapperIdField(true);
                                    }}
                                />
                                <strong>Public</strong>
                            </label>
                            <p style={{ fontSize: "0.8rem", marginTop: "-8px" }}>
                                (Anonymous and anyone can view)
                            </p>

                        {showMapperIdField && sharingOption === "open" && (
                            <div style={{ marginTop: "3px", textAlign: "center", alignItems: "center" }}>
                                <input
                                    type="number"
                                    placeholder="Your Mapper ID."
                                    value={mapperId}
                                    onChange={(e) => setMapperId(e.target.value)}
                                    style={{
                                        padding: "5px",
                                        fontSize: "1rem",
                                        width: "80%",
                                        textAlign: "center",
                                    }}
                                />
                                <p style={{ fontSize: "0.8rem" }}>
                                    No ID? Go to "Connect" and register
                                </p>
                            </div>
                        )}

                        <label style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                type="checkbox"
                                style={{ width: "20px", height: "20px" }}
                                checked={sharingOption === "private-sensitive"}
                                onChange={() => {
                                    setSharingOption("private-sensitive");
                                    setShowMapperIdField(false);
                                }}
                            />
                            <strong>Extra-Private</strong>
                        </label>
                        <p style={{ fontSize: "0.8rem", marginTop: "-8px" }}>
                            (Link expires in 7 days)
                        </p>
                    </div>

                    </section>

                    {/* Map Description Section */}
                    <section className="modal-section" style={{ textAlign: "center" }}>
                        <p style={{ fontWeight: "bold" }}>Describe your map in max. 3 words:</p>
                        <input
                            type="text"
                            placeholder="e.g. water pumps"
                            value={WhatsAppMapTags}
                            onChange={(e) => setWhatsAppMapTags(e.target.value)}
                            style={{
                                marginTop: "1px",
                                padding: "5px",
                                fontSize: "1rem",
                                width: "80%",
                                textAlign: "center",
                            }}
                        />
                    </section>
    
                    {/* Task ID Section */}
                    <section className="modal-section" style={{ textAlign: "center" }}>
                        <p style={{ fontWeight: "bold" }}>Do you have a Task ID?</p>
                        <div className="checkbox-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                            <label style={{ fontSize: "1rem" }}>
                                <input
                                    type="checkbox"
                                    style={{ width: "20px", height: "20px" }} // Make the checkbox slightly bigger
                                    checked={hasTaskId === true}
                                    onChange={() => setHasTaskId(true)}
                                />{" "}
                                Yes
                            </label>
                            <label style={{ fontSize: "1rem" }}>
                                <input
                                    type="checkbox"
                                    style={{ width: "20px", height: "20px" }} // Make the checkbox slightly bigger
                                    checked={hasTaskId === false}
                                    onChange={() => setHasTaskId(false)}
                                />{" "}
                                No
                            </label>
                        </div>
                        {hasTaskId === true && (
                            <input
                                type="text"
                                placeholder="Enter Task ID"
                                value={taskId}
                                onChange={(e) => setTaskId(e.target.value)}
                                style={{
                                    marginTop: "10px",
                                    padding: "5px",
                                    fontSize: "1rem",
                                    width: "80%",
                                    textAlign: "center",
                                }}
                            />
                        )}
                    </section>
    
                    {/* Share Button */}
                    <div className="option-button-container">
                        <button
                            className="btn"
                            onClick={handleShareDataClick}
                            disabled={
                                isButtonDisabled ||
                                sharingOption === null || // Ensure one of the three checkboxes is selected
                                hasTaskId === null || // Ensure Task ID selection is made
                                (hasTaskId === true && taskId.length < 6) || // Ensure Task ID is valid if selected
                                WhatsAppMapTags.trim().length === 0 || // Ensure the map description is not empty
                                (sharingOption === "open" && mapperId.length <= 6) // Ensure Mapper ID is 6 digits if "Public" is selected
                            }
                        >
                            {buttonText}
                        </button>
                    </div>
                    {!isMobileOrTablet() && (
                        <div className="option-button-container">
                            <button className="btn" onClick={handleDownload}>
                                Download Map
                            </button>
                        </div>
                    )}
                </>
                ) : (
                    <>
                {window.location.href.includes("import=") ? (
                    <>
                        <div className="option-button-container">
                            <button className="btn" onClick={handleShareCurrentUrl}>
                                Share
                            </button>
                        </div>
                        {!isMobileOrTablet() && (
                            <div className="option-button-container">
                                <button className="btn" onClick={handleDownload}>
                                    Download WhatsApp Map
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="modal-content">
                        <p style={{ textAlign: "center" }}>
                            You need to create a WhatsApp Map before you can share it!
                        </p>
                    </div>
                )}


                    </>
                )}
        </div>
    );
}

