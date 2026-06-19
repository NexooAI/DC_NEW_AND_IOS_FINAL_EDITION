import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

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
