import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import StatusBar from "./StatusBar.jsx";
import "./styles/burger-menu.css";
import { chevronDown, exitButtonIcon, GHIcon } from "./icons.js";
import { useClickOutside } from "./utils.js";

export default function BurgerMenu({
	isVisible,
	setIsVisible,
	setIsLoginVisible,
	setIsWelcomeVisible,
}) {
	const [openSection, setOpenSection] = useState(null);
	const burgerRef = useRef(null);

	const toggleSection = (sectionId) => {
		setOpenSection((prevOpenSection) =>
			prevOpenSection === sectionId ? null : sectionId
		);
	};

	const { t } = useTranslation();
	useClickOutside(burgerRef, () => setIsVisible(false));

	return (
		<div
			id="burger-menu"
			className={`${isVisible ? "drawer--open" : "drawer--closed"}`}
			ref={burgerRef}
		>
			<button onClick={() => setIsVisible(false)} className="btn--close-bm">
				{exitButtonIcon}
			</button>
			<StatusBar
				setIsSideMenuVisible={setIsVisible}
				setIsLoginVisible={setIsLoginVisible}
				setIsWelcomeVisible={setIsWelcomeVisible}
			/>
			<div className="bm__content">
				<div>
					<div className="bm__item">
						<div
							className="bm__item__summary"
							onClick={() => toggleSection("about")}
						>
							{chevronDown} {t("about")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "about" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("aboutContent") }}
						></div>
					</div>
					{/* New "How it works" tab */}
					<div className="bm__item">
						<div
							className="bm__item__summary"
							onClick={() => toggleSection("howitworks")}
						>
							{chevronDown} How it works
						</div>
						<div
							className={`bm__item__content ${
								openSection === "howitworks" ? "bm__item__content--open" : ""
							}`}
							style={{ paddingLeft: "1.2em" }}
						>
							<ul style={{ margin: 0 }}>
								<li>
									<a
										href="https://publicdocs-kapta-lite.s3.eu-west-2.amazonaws.com/LEAFLET_WhatsApp_Maps_User.png"
										target="_blank"
										rel="noopener noreferrer"
									>
										If you need WhatsApp Maps, click here.
									</a>
								</li>
								<li>
									<a
										href="https://publicdocs-kapta-lite.s3.eu-west-2.amazonaws.com/LEAFLET_WhatsApp_Business_Mapper.png"
										target="_blank"
										rel="noopener noreferrer"
									>
										If you want to make WhatsApp Maps, click here.
									</a>
								</li>
																<li>
									<a
										href="https://publicdocs-kapta-lite.s3.eu-west-2.amazonaws.com/LEAFLET_WhatsApp_Mapper.png"
										target="_blank"
										rel="noopener noreferrer"
									>
										If you want to explain how to contribute to a WhatsApp Map, click here.
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="bm__item">
						<div
							className="bm__item__summary"
							onClick={() => toggleSection("why")}
						>
							{chevronDown}
							{t("why")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "why" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("whyContent") }}
						></div>
					</div>
					<div className="bm__item">
						<div
							className="bm__item__summary"
							onClick={() => toggleSection("people")}
						>
							{chevronDown} {t("people")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "people" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("peopleContent") }}
						></div>
					</div>
					<div className="bm__item">
						<div
							className="bm__item__summary"
							onClick={() => toggleSection("what")}
						>
							{chevronDown}
							{t("what")}
						</div>
						<div
							className={`bm__item__content ${
								openSection === "what" ? "bm__item__content--open" : ""
							}`}
							dangerouslySetInnerHTML={{ __html: t("legalDisclaimer") }}
						></div>
					</div>
				</div>
				<div className="links-disclaimer__wrapper" style={{ textAlign: "center" }}>
					<div className="bm__item" >
						<a
							href="https://github.com/UCL/Kapta-Lite"
							id="gh"
							className="bm__item__content"
						>
							{GHIcon}
						</a>
						<div className="bm__item__text" style={{ marginTop: "0.5rem" }}>
							<p>Have feedback or <br />want to get in touch?</p>
							<p>
							Contact us on WhatsApp at<br /><a href="https://wa.me/447473522912">+44 7473522912</a> or email us at<br /><a href="mailto:info@kapta.earth">info@kapta.earth</a>.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
