import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./styles/map-etc.css";
import html2canvas from "html2canvas";
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
    showWaMappers, 
    setShowWaMappers, 
    ...dataDisplayProps // Add this to capture the props
}) {
    const [isBMVisible, setIsBMVisible] = useState(false); // Define the state for BurgerMenu visibility
    const [isModalOpen, setIsModalOpen] = useState(false); // State for the share modal
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // State for the search modal
    const [isPremium, setIsPremium] = useState(false); // State to differentiate between Search and Premium
    const [isRegisterMapper, setIsRegisterMapper] = useState(false); // State for "register as a mapper"

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
                    {/* <button
                        className="btn--burger-menu"
                        onClick={toggleBM}
                    >
                        <div className="map-action-icon">{menuIcon}</div>
                    </button> */}
                    {/* <BurgerMenu
                        isVisible={isBMVisible}
                        setIsVisible={setIsBMVisible}
                    /> */}
                    <button
                        id="connect"
                        type="button"
                        onClick={handleConnect}
                        className="map-action-btn"
                            >
                                <div className="map-action-icon">{connectIcon}</div>
                                <span className="map-action-label">
                                    {showWaMappers ? "Connect" : "Connect"}
                                </span>
                    </button>

                    <button
                        id="share"
                        type="button"
                        onClick={handleShare}
                        className="map-action-btn"
                    >
                        <div className="map-action-icon">
                            {importdata ? shareIcn : createIcn}
                        </div>
                        <span className="map-action-label">
                            {importdata ? "Share" : "Create"}
                        </span>
                    </button>
                    {(!isMobileOrTablet()) && (
                    <button
                        id="premium"
                        type="button"
                        onClick={handlePremium}
                        className="map-action-btn premium-btn" 
                        >
                        <div className="map-action-icon">{premiumIcn}</div>
                        <span className="map-action-label">Premium</span>
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

                 <button
                    className="btn"
                    onClick={() => setIsOpen(false)}>

                    Connect with<br />mappers in the map
                </button>
                <button
                    className="btn"
                    onClick={() => {
                    window.open(
                        "https://wa.me/447473522912?text=Hi,%20I%20would%20like%20to%20register%20as%20WhatsApp%20Mapper.",
                        "_blank"
                    );
                    }}
                >
                    Register as<br />WhatsApp Business Mapper
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
        <p>No open WhatsApp Maps in this area yet. Contribute yours!</p>
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
    
    console.log("ShareModalclick", dataDisplayProps);
    if (!isOpen) return null;
    const shareModalRef = useRef(null);
    const { t } = useTranslation();
    const [isOpenMapChecked, setIsOpenMapChecked] = useState(null);
    const [hasTaskId, setHasTaskId] = useState(null);
    const [taskId, setTaskId] = useState("");
    const [buttonText, setButtonText] = useState(t("sharedata"));
    const [isButtonDisabled, setButtonDisabled] = useState(false);
    const [kaptaWaMapUrl, setKaptaWaMapUrl] = useState(""); // Store the generated URL

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
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const date = new Date().toISOString().split("T")[0];
		const fileNameWAMap = `KaptaWhatsAppMap-${date}-${randomNum}-${taskId || "000000"}-${isOpenMapChecked ? "open" : "close"}`;

        try {
            const presignedUrl = await uploadProcessedChat(globalProcessedChatFile, fileNameWAMap, setButtonText, setButtonDisabled);
            const encodedPresignedUrl = encodeURIComponent(presignedUrl);
            const generatedUrl = `https://staging.d1aatc9qjk4pwp.amplifyapp.com/?import=${encodedPresignedUrl}`;
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

    useClickOutside(shareModalRef, () => setIsOpen(false));

    return (
        
        <div id="sharing-modal" ref={shareModalRef}>
            <button className="modal-close btn" onClick={() => setIsOpen(false)}>
                {closeIcon}
            </button>
            <div className="modal-title">
                {importdata ? t("sharingTitle") : "Create WhatsApp Map"}
            </div>
    
            {importdata ? (
                <>
                    {/* Open WhatsApp Map Section */}
                    <section className="modal-section">
                        <p>Do you want to share this as an OPEN WhatsApp Map?</p>
                        <div className="checkbox-container">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isOpenMapChecked === false}
                                    onChange={() => setIsOpenMapChecked(false)}
                                />{" "}
                                No
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isOpenMapChecked === true}
                                    onChange={() => setIsOpenMapChecked(true)}
                                />{" "}
                                Yes
                            </label>
                        </div>
                    </section>
    
                    {/* Task ID Section */}
                    <section className="modal-section">
                        <p>Do you have a TASK ID?</p>
                        <div className="checkbox-container">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={hasTaskId === false}
                                    onChange={() => {
                                        setHasTaskId(false);
                                        setTaskId("");
                                    }}
                                />{" "}
                                No
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={hasTaskId === true}
                                    onChange={() => setHasTaskId(true)}
                                />{" "}
                                Yes
                            </label>
                        </div>
                        {hasTaskId && (
                            <input
                                type="number"
                                placeholder="Enter Task ID"
                                value={taskId}
                                onChange={(e) =>
                                    setTaskId(e.target.value.replace(/\D/g, ""))
                                } // Allow only numeric input
                                maxLength={6}
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
                                isOpenMapChecked === null ||
                                hasTaskId === null ||
                                (hasTaskId === true && taskId.length < 6)
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
                    {/* Content for when importdata is false */}
                    <div className="modal-content">
                        <p>Create WhatsApp Maps with Kapta in 3 simple steps:</p>
                        <ol>
                            
                            <li>Share locationsin a<br />WhatsApp Group</li>
                            <li>Export chat to<br />Kapta Lite app</li>
                            <li>Share your<br />WhatsApp Map</li>
                        </ol>
                        {(!isMobileOrTablet()) && (
                        <p>Or if you already have the chat. Upload to convert it.</p>
                       )}
                       <div className="option-button-container">
                             <button className="btn" 
                            
                            onClick={() => { 
                                window.open(
                                    "https://wa.me",
                                    "_blank"
                                );
                            }}
                            
                            >
                                Start mapping
                            </button>
                            <button className="btn" 
                            onClick={() => { 
                                window.open(
                                    "https://youtu.be/cE30c18ipfU",
                                    "_blank"
                                );
   
                            }}
                            
                            >
                                Watch Tutorial
                            </button>
                            <button className="btn" 
                            
                            onClick={() => { 
                                window.open(
                                    "https://wa.me/447473522912?text=Hi%2C%20please%20help%20me%20create%20a%20WhatsApp%20Map.",
                                    "_blank"
                                );
                            }}
                            
                            >
                                Need help?<br />Contact us
                            </button>
                            {(!isMobileOrTablet()) && (
                         <div className="option-button-container">
                            
                            {enableDownload ? (
                                <button className="btn" onClick={handleDownload}>
                                    Download<br />this map
                                </button>
                            ) : (
                                <button className="btn" disabled style={{ display: "none" }}>
                                    Upload<br />a map
                                </button>
                            )}
                         <button className="btn" 
                       
                            onClick={() => { 
                               
                                const filePickerButton = document.getElementById("filePickerButton")
                                filePickerButton.click(); // Programmatically trigger the click
                                setIsOpen(false)
                            }}
                        > Convert a chat<br />into a map
                        </button>
                        </div>

                        )}
                        </div>

                    </div>
                        {/* {(!isMobileOrTablet() || isIOS()) && (
                            <FilePicker {...dataDisplayProps}/> //this for some reason is not working
                        )} */}
            
                </>
            )}
        </div>
    );
}

