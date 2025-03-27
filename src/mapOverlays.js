import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./styles/map-etc.css";
import html2canvas from "html2canvas";
import {
    shareIcn,
    closeIcon,
    imageIcn,
    dataIcn,
    uploadIcn,
    chevronUp,
    exitButtonIcon,
    msgIcon,
} from "./icons";
import { slugify, useClickOutside } from "./utils.js";
import { isMobileOrTablet } from "./main.js";
import { useUserStore } from "./UserContext.jsx";
import { ASK_URL, hasCognito } from "../globals.js";
import { uploadProcessedChat } from "./data_submission.js";
import { globalProcessedChatFile } from "./import_whatsapp";

function ShareBtn({ setOpen }) {
    const openShareModal = () => setOpen(true);
    return (
        <button type="button" className="share" onClick={openShareModal}>
            {shareIcn}
        </button>
    );
}

function SubmitBtn() {
    return (
        <button type="submit" className="submit">
            {chevronUp}
        </button>
    );
}

function InputArea({ setTitle, setPulse, setModalOpen, currentDataset }) {
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
        <form className="filter__form" onSubmit={handleSubmit}>
            <div className="filter__wrapper">
                <textarea
                    placeholder={placeholderValue}
                    name="filter"
                    onChange={handleInputChange}
                    value={filterValue}
                ></textarea>
            </div>
            {isSubmit ? <SubmitBtn /> : <ShareBtn setOpen={setModalOpen} />}
        </form>
    );
}

export function MapActionArea({
    setTitle,
    setPulse,
    showMenu,
    setModalOpen,
    currentDataset,
}) {
    return (
        <div id="map-actions-container">
            <div className="map-actions__wrapper">
                <div className="map-actions__body">
                    <button id="exit-map" type="button" onClick={showMenu}>
                        {exitButtonIcon}
                    </button>
                    <button id="connect" type="button" onClick={showMenu}>
                        {exitButtonIcon}
                    </button>
                    <InputArea
                        setTitle={setTitle}
                        setPulse={setPulse}
                        setModalOpen={setModalOpen}
                        currentDataset={currentDataset}
                    />
                </div>
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
            <div className="modal-title">{t("sharingTitle")}</div>

            {/* Open WhatsApp Map Section */}
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

            {/* Task ID Section */}
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
                    onChange={(e) => setTaskId(e.target.value.replace(/\D/g, ""))} // Allow only numeric input
                    maxLength={6}
                />
            )}

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
        </div>
    );
}