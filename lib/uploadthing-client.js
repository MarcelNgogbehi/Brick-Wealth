// lib/uploadthing-client.js
//
// UploadThing client-side helpers.
// Generates React hooks tied to your file router definition.
// Used by the verify page's KYC step.

import { generateReactHelpers } from "@uploadthing/react";

export const { uploadFiles, useUploadThing } = generateReactHelpers();