const API_URL = "https://mjbhgmtnxe.execute-api.eu-west-2.amazonaws.com/prod/KaptaLite_test";

export async function uploadProcessedChat(file, fileNameWAMap, setStatusText, setButtonDisabled) {
    setStatusText("Preparing for sharing...");
    setButtonDisabled(true);

    try {
        // Step 1: Request a pre-signed URL from the backend
        const response = await fetch(`${API_URL}/upload-url`, {
            method: "POST",
            body: JSON.stringify({ fileName: fileNameWAMap, fileType: file.type }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to get pre-signed URL");

        const { presignedUrl } = await response.json();
        // console.log("✅ Pre-signed URL:", presignedUrl);

        // Step 2: Upload the file to S3 using the pre-signed URL
        setStatusText("Uploading...");
        const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type }
        });

        if (!uploadResponse.ok) {
            throw new Error(`S3 upload failed with status ${uploadResponse.status} - ${await uploadResponse.text()}`);
        }

        console.log("✅ File uploaded successfully");

        // Step 3: Fetch the pre-signed download URL
        // const encodedFileName = encodeURIComponent(fileNameWAMap);
        const downloadResponse = await fetch(`${API_URL}/download-url?fileName=${fileNameWAMap}`);

        if (!downloadResponse.ok) throw new Error(`Failed to get download URL: ${await downloadResponse.text()}`);

        const { presignedUrl: downloadUrl } = await downloadResponse.json();
        console.log("✅ Pre-signed Download URL:", downloadUrl);

        setStatusText("Ready to Share!!!");
        setButtonDisabled(false);

        // Step 4: Return the pre-signed download URL
        return downloadUrl;

    } catch (error) {
        console.error("❌ Upload error:", error);
        setStatusText("Upload failed! See console.");
        setButtonDisabled(false);
        throw error;
    }
}