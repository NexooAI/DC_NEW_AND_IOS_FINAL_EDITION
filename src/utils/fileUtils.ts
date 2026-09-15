import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

/**
 * Generates a PDF file from HTML using base64 encoding to ensure 
 * the file is created inside the app's scoped FileSystem.cacheDirectory.
 * This guarantees read/share permissions across Expo Go, Android, and iOS.
 */
export const getPdfFileUri = async (htmlContent: string, fileName: string): Promise<string> => {
  const { base64, uri } = await Print.printToFileAsync({ html: htmlContent, base64: true });
  if (base64) {
    const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const targetUri = `${targetDir}${fileName}`;
    await FileSystem.writeAsStringAsync(targetUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    return targetUri;
  }
  return uri;
};

export const saveFileToPublicDirectory = async (
  targetUri: string,
  fileName: string,
  successMessage: string = "File saved successfully!"
) => {
  try {
    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const directoryUri = permissions.directoryUri;
        const fileContent = await FileSystem.readAsStringAsync(targetUri, { encoding: FileSystem.EncodingType.Base64 });
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, fileName, "application/pdf");
        await FileSystem.writeAsStringAsync(fileUri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
        Alert.alert("Success", successMessage);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(targetUri, {
            UTI: "com.adobe.pdf",
            mimeType: "application/pdf",
            dialogTitle: "Save receipt",
          });
        }
      }
    } else {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(targetUri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
          dialogTitle: "Save receipt",
        });
      }
    }
  } catch (err) {
    console.error("Save file failed:", err);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(targetUri, {
        UTI: "com.adobe.pdf",
        mimeType: "application/pdf",
        dialogTitle: "Save receipt",
      });
    }
  }
};
