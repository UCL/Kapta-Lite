import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { i18next, savedLanguage, supportedLanguages } from "./languages.js";
import { FileParser, allowedExtensions } from "./import_whatsapp.js";
import "./styles/menu.css";
import { isIOS, isMobileOrTablet } from "./main.js";
import ReactGA from "react-ga4";
import { ASK_URL } from "../globals.js";
import BurgerMenu from "./BurgerMenu.jsx";
import { menuIcon } from "./icons.js";
import { LoginDialog, WelcomeBackDialog } from "./Login.jsx";
import Loader from "./Loader.jsx"; // Import Loader component

function LanguageSelector({ supportedLanguages }) {
    // Get the saved language from localStorage or fallback to i18next language
    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        return savedLanguage || i18next.language;
    });

    // Handle language change
    const handleChange = (event) => {
        // set lang in local storage and il8next
        const newLanguage = event.target.value;
        localStorage.setItem("preferredLanguage", newLanguage);
        i18next.changeLanguage(newLanguage).catch((error) => {
            console.error("Error changing language", error);
        });
        ReactGA.event({
            category: "Language",
            action: "Language Changed",
            label: newLanguage,
        });
        // Update the state to trigger a re-render
        setSelectedLanguage(newLanguage);
    };

    return (
        <select
            value={selectedLanguage}
            onChange={handleChange}
            id="languageSelector"
        >
            {Object.entries(supportedLanguages).map(([key, value]) => (
                <option key={key} value={key}>
                    {value}
                </option>
            ))}
        </select>
    );
}

function Instructions() {
    const { t } = useTranslation();
    return (
        <div
            id="instructions"
            dangerouslySetInnerHTML={{ __html: t("instructions") }}
        ></div>
    );
}

function VideoModal({ isOpen, setIsOpen }) {
    if (!isOpen) return null;

    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            ReactGA.event({
                category: "Tutorial",
                action: "Tutorial Opened",
            });

            const handleMainClick = () => {
                setIsOpen(false);
                document
                    .querySelector("#main")
                    .removeEventListener("click", handleMainClick);
            };
            document
                .querySelector("#main")
                .addEventListener("click", handleMainClick);
            return () => {
                document
                    .querySelector("#main")
                    .removeEventListener("click", handleMainClick);
            };
        }
    }, [isOpen, setIsOpen]);

    return (
        <div id="video-modal">
            <div className="video-modal__inner">
                <button className="modal-close btn" onClick={() => setIsOpen(false)}>
                    &times;
                </button>
                <iframe
                    id="videoElement"
                    width="99%"
                    height="500px"
                    src={t("tutorialUrl")}
                    allow="autoplay; encrypted-media;"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}

function RecentMapButton({ showMap }) {
    const { t } = useTranslation();
    return (
        <button
            id="recentBtn"
            className="btn menu-btn"
            onClick={() => showMap(false)}
        >
            {t("viewrecentmap")}
        </button>
    );
}
export function FilePicker(dataDisplayProps,) {
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        file && setSelectedFile(file);
        event.target.value = null; // Clear the input value
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const { t } = useTranslation();
    return (
        <>
            <input
                type="file"
                accept={allowedExtensions.join(",")}
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            {/* <button onClick={handleButtonClick} className="btn menu-btn file-input"> */}

            <button id="filePickerButton" onClick={handleButtonClick}>
                {t("selectFile")}
            </button>
            {selectedFile && (
                <FileParser
                    file={selectedFile}
                    {...dataDisplayProps}
                    onComplete={() => setSelectedFile(null)}
                />
            )}
        </>
    );
}

function ButtonArea({ hasCurrentDataset, showMap }) {
    const [isOpen, setIsVideoOpen] = useState(false);

    const { t } = useTranslation();

    return (
        <>
            <VideoModal isOpen={isOpen} setIsOpen={setIsVideoOpen} />
            <div className="button-area">
                <button
                    id="tutorialBtn"
                    onClick={() => setIsVideoOpen(true)}
                    className="btn menu-btn"
                >
                    {t("watchtutorial")}
                </button>

                <button
                    id="helpBtn"
                    className="btn menu-btn"
                    onClick={() => {
                        ReactGA.event({
                            category: "Help",
                            action: "Help Button Clicked",
                        });
                        window.location.href = ASK_URL;
                    }}
                >
                    {t("asktheteam")}
                </button>

                {/* show recent map */}
                {hasCurrentDataset && <RecentMapButton showMap={showMap} />}
            </div>
        </>
    );
}

function Copyright() {
    const { t } = useTranslation();
    return <div id="copyright">{t("copyright")}</div>;
}

export default function MainMenu({
    isVisible,
    setIsLoginVisible,
    setIsWelcomeVisible,
    dataset,
    ...dataDisplayProps
}) {
    const [isBMVisible, setIsBMVisible] = useState(false);
    const [isLoaderVisible, setIsLoaderVisible] = useState(false); // State for loader visibility
    // const [importParam, setImportParam] = useState(null); // State for importParam
    const [loadingMessage, setLoadingMessage] = useState(false); // State for loading message visibility

    const toggleBM = () => {
        setIsBMVisible((prevState) => !prevState);
    };

    const handleButtonClick = async () => {
        try {
            setIsLoaderVisible(true); // Show loader
            const query = window.location.search;
            const importParam = query.startsWith('?import=') ? query.slice(8) : null;
            // setImportParam(importParam); // Set importParam state
            console.log('Import URL:', importParam);

            if (!importParam) {
                throw new Error('No import URL found in query.');
            } else {
                setLoadingMessage(true); // Show the loading message
            }

            const decodedUrl = decodeURIComponent(importParam);
            console.log('Decoded import URL:', decodedUrl);

            const response = await fetch(decodedUrl);
            if (!response.ok) {
                console.error('Fetch Response Status:', response.status);
                console.error('Fetch Response Headers:', response.headers);
                throw new Error(`Fetch error! Status: ${response.status}`);
            }

            const blob = await response.blob();
            const file = new File([blob], 'import.zip', { type: 'application/zip' });
            dataDisplayProps.setFileToParse(file);
        } catch (error) {
            console.error('Error fetching or uploading file:', error);
        } finally {
            setIsLoaderVisible(false); // Hide loader
            setLoadingMessage(false); // Hide the loading message
            console.log('Loader hidden');
        }
    };

    useEffect(() => {
        if (window.location.search.includes('?import=')) {
            console.log('Import URL detected in query.');
            handleButtonClick();
        } else {
            dataDisplayProps.showMap(true); // Show map if no import URL
        }
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {loadingMessage && (
                <div id="loadingMessage" className="loading-message">
                    Your WhatsApp Map is loading. This might take a few seconds.
                </div>
            )}
            <Loader
                isVisible={isLoaderVisible}
                setIsVisible={setIsLoaderVisible}
                // importParam={importParam}
            />
            <button onClick={toggleBM} className="btn--burger-menu">
                {menuIcon}
            </button>
            <BurgerMenu
                isVisible={isBMVisible}
                setIsVisible={setIsBMVisible}
                setIsLoginVisible={setIsLoginVisible}
                setIsWelcomeVisible={setIsWelcomeVisible}
            />
            <div id="menuContainer">
                <LanguageSelector supportedLanguages={supportedLanguages} />
                <Instructions />
                <ButtonArea
                    showMap={dataDisplayProps.showMap}
                    hasCurrentDataset={dataset}
                />
                {(!isMobileOrTablet() || isIOS()) && (
                    <FilePicker {...dataDisplayProps} />
                )}
                <Copyright />
            </div>
        </>
    );
}
