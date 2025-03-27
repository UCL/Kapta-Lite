import React, { useEffect, useState } from "react";
import { i18next } from "./languages.js";
import ReactDOM from "react-dom/client";
import { FileParser } from "./import_whatsapp.js";
import { Map } from "./map.js";
import InstallDialog from "./Install.jsx";
import MainMenu from "./MainMenu.jsx";
import Loader from "./Loader.jsx";
import "./styles/main.css";
import ReactGA from "react-ga4";
import { UserProvider } from "./UserContext.jsx";
import { LoginDialog, WelcomeBackDialog } from "./Login.jsx";

export const isMobileOrTablet = () => {
    return (
        /iPad|iPhone|iPod|android|Mobile|mini|Fennec|Symbian|Windows Phone|BlackBerry|IEMobile/i.test(
            navigator.userAgent
        ) ||
        (window.innerWidth <= 1024 &&
            ("ontouchstart" in window || navigator.maxTouchPoints > 0))
    );
};
export const isIOS = () => {
    return /iPad|iPhone|iPod/i.test(navigator.userAgent);
};

function initServiceWorker(setFileToParse) {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.info("SW registered: ", registration);
                })
                .catch((registrationError) => {
                    console.info("SW registration failed: ", registrationError);
                });
        });

        if (!isMobileOrTablet() || isIOS()) {
            window.addEventListener("load", function () {
                const shownWorksBestOnAndroid = localStorage.getItem(
                    "shownWorksBestOnAndroid"
                );

                if (!shownWorksBestOnAndroid) {
                    alert(i18next.t("desktoporiosPrompt")); // using like this since can't use useTranslation outside a component
                    localStorage.setItem("shownWorksBestOnAndroid", "true");
                }
            });
        }
    }

    navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.action !== "load-map") return;
        return setFileToParse(event.data.file);
    });

    navigator.serviceWorker.controller?.postMessage("share-ready");
}

function App() {
    const [fileToParse, setFileToParse] = useState(null);

    useEffect(() => {
        // Initialize GA and SW
        initServiceWorker(setFileToParse);
        // ReactGA.initialize("G-LEP1Y0FVCD");  //disable GA for dev
    }, []); // Empty dependency array ensures this effect runs once on mount

    const [isMapVisible, setIsMapVisible] = useState(true); // Always show map
    const [mapData, setMapData] = useState(null);
    const [isLoaderVisible, setIsLoaderVisible] = useState(true);
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

    const showMap = (showLoader = false) => {
        if (showLoader) setIsLoaderVisible(true);
        setIsMapVisible(true);
    };

    const dataDisplayProps = {
        setMapData,
        showMap,
        setFileToParse,
    }; // setting these in an object so they're easier to pass and update

    return (
        <UserProvider>
            <InstallDialog />
            <Loader isVisible={isLoaderVisible} setIsVisible={setIsLoaderVisible} />
            <LoginDialog
                isVisible={isLoginVisible}
                setIsVisible={setIsLoginVisible}
                setIsWelcomeVisible={setIsWelcomeVisible}
            />
            <WelcomeBackDialog
                isVisible={isWelcomeVisible}
                setIsVisible={setIsWelcomeVisible}
            />
            <MainMenu
                isVisible={false} // Never show menu
                setIsLoginVisible={setIsLoginVisible}
                setIsWelcomeVisible={setIsWelcomeVisible}
                dataset={mapData}
                {...dataDisplayProps}
            />
            {fileToParse && <FileParser file={fileToParse} {...dataDisplayProps} />}
            <Map
                isVisible={isMapVisible}
                data={mapData}
                isLoginVisible={isLoginVisible}
                setIsLoginVisible={setIsLoginVisible}
            />
        </UserProvider>
    );
}

const rootElement = document.getElementById("main");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
