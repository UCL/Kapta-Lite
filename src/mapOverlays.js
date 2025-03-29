import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./styles/map-etc.css";
import html2canvas from "html2canvas";
import {
    shareIcn,
    closeIcon,
    createIcn,
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
import BurgerMenu from "./BurgerMenu.jsx";
import { handleConnect } from "./ConnectButton.js";
import { handleSearch } from "./SearchBar.js";
import { importdata } from "./import_whatsapp.js";



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
            <div className="filter__wrapper">
                <textarea
                placeholder={placeholderValue}
                name="filter"
                onChange={handleInputChange}
                value={filterValue}
                ></textarea>

                <button id="search" type="button" onClick={search}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 22L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
    connect
}) {
    const [isBMVisible, setIsBMVisible] = useState(false); // Define the state for BurgerMenu visibility
    const [isModalOpen, setIsModalOpen] = useState(false); // State for the share modal
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // State for the search modal

    const toggleBM = () => {
        setIsBMVisible((prevState) => !prevState);
    };

    const handleShare = () => {
        setIsModalOpen(true); // Opens the share modal
    };

    const handleSearch = () => {
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
                    <button
                        className="btn--burger-menu"
                        onClick={toggleBM}
                    >
                        <div className="map-action-icon">{menuIcon}</div>
                    </button>
                    <BurgerMenu
                        isVisible={isBMVisible}
                        setIsVisible={setIsBMVisible}
                    />
                    <button
                        id="connect"
                        type="button"
                        onClick={connect}
                        className="map-action-btn"
                    >
                        <div className="map-action-icon">{connectIcon}</div>
                        <span className="map-action-label">Connect</span>
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
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
                currentDataset={currentDataset}
            />

            {/* Search Modal */}
            <SearchModal
                isOpen={isSearchModalOpen}
                setIsOpen={setIsSearchModalOpen}
            />
        </div>
    );
}

export function SearchModal({ isOpen, setIsOpen }) {
    if (!isOpen) return null;

    const searchModalRef = useRef(null);

    useClickOutside(searchModalRef, () => setIsOpen(false)); // Close modal when clicking outside

    return (
        <div id="search-modal" ref={searchModalRef}>
            <button className="modal-close btn" onClick={() => setIsOpen(false)}>
                {closeIcon}
            </button>
            <div className="modal-title">Search</div>
            <div className="modal-content">
                <p>No open data at this time</p>
            </div>
        </div>
    );
}

export function ShareModal({
    isOpen,
    setIsOpen,
    currentDataset,
    setIsUploadDialogOpen,
}) {
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
            const generatedUrl = `http://localhost:8080/?import=${encodedPresignedUrl}`;
            setKaptaWaMapUrl(generatedUrl); // Store the generated URL
            setButtonText("Click to share the map directly with WhatsApp or other apps");
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
                                type="text"
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
                </>
            ) : (
                <>
                    {/* Content for when importdata is false */}
                    <div className="modal-content">
                        <p>Create WhatsApp Maps with Kapta in 3 simple steps:</p>
                        <ol>
                            <li>Upload your WhatsApp chat file.</li>
                            <li>Customize your map settings.</li>
                            <li>Generate and share your map.</li>
                        </ol>
                    </div>
    
                    {/* Close Button */}
                    <div className="option-button-container">
                        <button className="btn" onClick={() => setIsOpen(false)}>
                            Close
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}