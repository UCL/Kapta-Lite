import { useEffect } from "react";

export const slugify = (str) => {
	str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
	str = str.toLowerCase();
	str = str
		.replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
		.replace(/\s+/g, "-") // replace spaces with hyphens
		.replace(/-+/g, "-"); // remove consecutive hyphens
	return str;
};

export const generateCampaignCode = () => {
	// generate 6 character alphanumeric access code
	return crypto.randomUUID().replace(/-/g, "").substring(0, 6).toUpperCase();
};
export const useClickOutside = (ref, handler) => {
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (ref.current && !ref.current.contains(event.target)) {
				handler();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [ref, handler]);
};

export const sha256 = async (text) => {
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	const hash = await crypto.subtle.digest("SHA-256", data);

	return Array.from(new Uint8Array(hash))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
};

export const rescaleAndCompressImageBlob = async (blob, format = "image/webp", maxWidth = 500, quality = 0.3) => {
	console.log("Rescaling and compressing image blob...");
	const img = new Image();

	return new Promise((resolve, reject) => {
		img.onload = () => {
			const scale = Math.min(1, maxWidth / img.width);
			const width = img.width * scale;
			const height = img.height * scale;
			const canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d");
			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(img, 0, 0, width, height);
			canvas.toBlob(
				(blob) => {
					URL.revokeObjectURL(img.src); // Clean up the object URL
					resolve(blob);
				},
				format,
				quality
			);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(image.src);
			reject(new Error(`Error: Failed to load image: ${e.message}`));
		};
		img.src = URL.createObjectURL(blob); // Set the source to trigger loading
	});
}

export const getImageURLFromZip = async (zip, imgFilename) => {
	const file = zip.file(
		// Match the filename, escaping special characters
		new RegExp(imgFilename.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$")
	);
	if (!file || file.length === 0) {
		console.error(`File not found in ZIP: ${imgFilename}`);
		throw new Error(`File not found in ZIP: ${imgFilename}`);
	}

	const blob = await file[0].async("blob");
	return URL.createObjectURL(blob);
}