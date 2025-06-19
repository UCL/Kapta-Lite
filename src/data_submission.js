const API_URL = "https://mjbhgmtnxe.execute-api.eu-west-2.amazonaws.com/prod/KaptaLite_test";
const BUCKET_BASE_URL = "https://s3.eu-west-2.amazonaws.com/kapta-lite-private-maps";

export async function uploadProcessedChat(file, fileNameWAMap, setStatusText, setButtonDisabled, sharingOption, taskId, WhatsAppMapTags, wabMapperId) {
    setStatusText("Uploading... Wait");
    setButtonDisabled(true);

    try {
        const visibility = sharingOption; // "private-sensitive", "private-non-sensitive", or "open"
        const taskIdFolder = taskId || "noTaskId";; // To classify data by taskId, and give a value if no value
        const tagsFolder = WhatsAppMapTags || "noMapTags"; // To classify data by tags
        const WABMapperFolder = wabMapperId || "noWabMapperId"; // WhatsApp Mapper ID

        console.log("📦 Sending to /download-url:", {
            fileName: fileNameWAMap,
            visibility,
            taskIdFolder,
            tagsFolder,
            WABMapperFolder
        });

        // Step 1: Request a pre-signed URL from the backend
        const response = await fetch(`${API_URL}/upload-url`, {
            method: "POST",
            body: JSON.stringify({
                fileName: fileNameWAMap,
                fileType: file.type,
                visibility,
                taskIdFolder,
                tagsFolder,
                WABMapperFolder
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to get pre-signed URL");

        const { presignedUrl } = await response.json();

        // Step 2: Upload the file to S3 using the pre-signed URL
        setStatusText("Uploading... Wait");
        const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type }
        });

        if (!uploadResponse.ok) {
            throw new Error(`S3 upload failed with status ${uploadResponse.status} - ${await uploadResponse.text()}`);
        }

        console.log("✅ File uploaded successfully");

        // Optional handling logic per sharingOption
        if (sharingOption === "private-sensitive") {
            console.log("Handling private-sensitive scenario...");
        } else if (sharingOption === "private-non-sensitive") {
            console.log("Handling private-non-sensitive scenario...");
        } else if (sharingOption === "open") {
            console.log("Handling open scenario...");
        } else {
            console.log("Unknown sharing option. Default behavior.");
        }

        let downloadUrl;

        if (visibility === "private-sensitive") {
            // Step 3a: Fetch the pre-signed download URL
            const downloadResponse = await fetch(`${API_URL}/download-url?fileName=${fileNameWAMap}&visibility=${visibility}&taskIdFolder=${taskIdFolder}&tagsFolder=${tagsFolder}`);

            if (!downloadResponse.ok) throw new Error(`Failed to get download URL: ${await downloadResponse.text()}`);

            const result = await downloadResponse.json();
            downloadUrl = result.presignedUrl;
            console.log("✅ Pre-signed Download URL:", downloadUrl);
        } else {
            // Step 3b: Generate permanent URL manually
            downloadUrl = `${BUCKET_BASE_URL}/uploads/${visibility}/${taskIdFolder}/${tagsFolder}/${fileNameWAMap}`;
            console.log("🌍 Public Download URL with prefix rules and referer checks:", downloadUrl);
        }

        setStatusText("Ready to Share!!!");
        setButtonDisabled(false);

        return downloadUrl;

    } catch (error) {
        console.error("❌ Upload error:", error);
        setStatusText("Upload failed! See console.");
        setButtonDisabled(false);
        throw error;
    }
}
