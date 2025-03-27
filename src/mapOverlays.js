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
    const filenameSlug = currentDataset.slug;
    const shareContent = {
        title: "#MadeWithKapta",
        text: "Create your WhatsApp Maps with Kapta https://kapta.earth/",
        url: "https://kapta.earth/",
    };
    const handleShareImgClick = () => {
        let errorMsg;
        html2canvas(document.querySelector("#map"), {
            allowTaint: true,
            useCORS: true,
            imageTimeout: 5000,
            removeContainer: true,
            logging: false,
            foreignObjectRendering: false,
            ignoreElements: function (element) {
                if ("button" == element.type || "submit" == element.type) {
                    return true;
                }
                if (element.classList.contains("buttons")) {
                    return true;
                }
                if (element.id === "map-actions-container") {
                    return true;
                }
            },
        }).then(async function (canvas) {
            const dataURL = canvas.toDataURL();
            const blob = await (await fetch(dataURL)).blob();
            const filename = `${filenameSlug}.png`;
            const filesArray = [
                new File([blob], filename, {
                    type: blob.type,
                    lastModified: new Date().getTime(),
                }),
            ];
            const shareData = {
                files: filesArray,
            };
            if (navigator.canShare && navigator.canShare(shareData)) {
                navigator
                    .share({
                        files: filesArray,
                        ...shareContent,
                    })
                    .then(() => {
                        errorMsg = "Failed to share map image";
                    });
            } else {
                try {
                    errorMsg = "Sharing not supported, image copied to clipboard";
                    navigator.clipboard.write([
                        new ClipboardItem({
                            "image/png": blob,
                        }),
                    ]);
                } catch (error) {
                    console.error(error);
                    errorMsg = "Failed to write image to clipboard";
                }
            }
            if (errorMsg) {
                const dialog = document.createElement("dialog");
                dialog.textContent = errorMsg;
                dialog.classList.add("error-dialog");
                document.body.appendChild(dialog);
                dialog.showModal();
                dialog.classList.add("showing");
                setTimeout(() => {
                    dialog.classList.remove("showing");
                    setTimeout(() => {
                        dialog.remove();
                    }, 1000);
                }, 3000);
            }
        });
    };

    const downloadFile = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShareDataClick = async () => {
		if (!globalProcessedChatFile) {
			console.error("❌ No processed chat file available.");
			return;
		}
	
		const button = document.querySelector(".btn");
		const originalText = button.textContent;
		button.textContent = "Preparing for sharing...";
		button.disabled = true;
	
		try {
			// Use the globalProcessedChatFile for upload
			const presignedUrl = await uploadProcessedChat(globalProcessedChatFile, (text) => {
				button.textContent = text;
			}, (disabled) => {
				button.disabled = disabled;
			});
	
			button.textContent = "Ready to Share!!!";
			button.disabled = false;
	
			button.onclick = () => {
				window.open(presignedUrl, "_blank");
			};
		} catch (error) {
			console.error("❌ Upload error:", error);
			button.textContent = originalText;
			button.disabled = false;
		}
	};

    const handleUploadClick = () => {
        console.log("Upload with task ID to be developed yet");
    };

    const handleHelpClick = (evt) => {
        evt.target.style.backgroundColor = "#a6a4a4";
        setTimeout(() => {
            window.location.href = ASK_URL;
            evt.target.style.backgroundColor = "white";
        }, 500);
    };

    const [isOpenMapChecked, setIsOpenMapChecked] = useState(false);

    useClickOutside(shareModalRef, () => setIsOpen(false));

    return (
        <>
            <div id="sharing-modal" ref={shareModalRef}>
                <button className="modal-close btn" onClick={() => setIsOpen(false)}>
                    {closeIcon}
                </button>
                <div className="modal-title">{t("sharingTitle")}</div>
                <div className="option-button-container">
                    <button className="btn" onClick={handleShareDataClick}>
                        {dataIcn}
                        {t("sharedata")}
                    </button>
                    <button className="btn" onClick={handleUploadClick}>
                        {uploadIcn}
                        {t("uploaddata")}
                    </button>
                </div>

                <div className="checkbox-container" style={{ marginTop: "1rem" }}>
                    <p>To share as OPEN WhatsApp Map, check this box</p>
                    <label>
                        <input
                            type="checkbox"
                            checked={isOpenMapChecked}
                            onChange={(e) => setIsOpenMapChecked(e.target.checked)}
                        />{" "}
                        Share as open map
                    </label>
                </div>
            </div>
        </>
    );
}