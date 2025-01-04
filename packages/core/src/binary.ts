import { DOCX_MIME_TYPE, PDF_MIME_TYPE, XLSX_MIME_TYPE } from "./constants"

/**
 * Determines if a given MIME type is binary.
 * Checks against common and additional specified binary types.
 * @param mimeType - The MIME type to check.
 * @returns boolean - True if the MIME type is binary, otherwise false.
 */
export function isBinaryMimeType(mimeType: string) {
    return (
        /^(image|audio|video)\//.test(mimeType) || // Common binary types
        BINARY_MIME_TYPES.includes(mimeType) // Additional specified binary types
    )
}

// List of known binary MIME types
const BINARY_MIME_TYPES = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/x-bzip",
    "application/x-bzip2",
    "application/x-gzip",

    // Executables and binaries
    "application/octet-stream", // General binary type (often default for unknown binary files)
    "application/x-msdownload", // Executables
    "application/x-shockwave-flash", // SWF
    "application/java-archive", // JAR (Java)

    // Others
    "application/vnd.google-earth.kml+xml", // KML (though XML based, often treated as binary in context of HTTP)
    "application/vnd.android.package-archive", // APK (Android package)
    "application/x-iso9660-image", // ISO images
    "application/vnd.apple.installer+xml", // Apple Installer Package (though XML, often handled as binary)
]