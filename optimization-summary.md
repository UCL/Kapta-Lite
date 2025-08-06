## Image Size Calculation Optimization Implementation

### Problem
The image size calculation for determining compression quality and button disable states was happening only when the ShareModal opened, causing a delay and poor user experience.

### Solution
Implemented immediate image size calculation whenever a zip file is uploaded or generated, storing the results globally for instant access when the ShareModal opens.

### Changes Made

#### 1. mapOverlays.js
- Added global storage: `window.globalImageSizeInfo`
- Created global function: `window.calculateAndStoreImageSize()`
- Modified ShareModal useEffect to check for pre-calculated values first
- Falls back to on-demand calculation for compatibility

#### 2. map.js
- Added wrapper function `setFileToParseWithSizeCalc()` 
- Replaced all `setFileToParse()` calls with the wrapper
- Added size calculation after zip file generation in `updateGlobalData()`

#### 3. import_images.js
- Added size calculation call after zip file generation for image data

#### 4. import_whatsapp.js
- Added size calculation calls after WhatsApp chat processing
- Covers both GeoJSON and text chat file processing

### Benefits
✅ **Immediate Feedback**: Size validation happens during upload/generation
✅ **Instant Modal Response**: ShareModal opens with pre-calculated values  
✅ **Better UX**: No delay in showing "too big" warnings or disabled buttons
✅ **Maintained Compatibility**: Falls back to old behavior if pre-calculation fails
✅ **Consistent Quality**: Dynamic compression quality set immediately upon file processing

### User Flow
1. User uploads/generates zip file → **Size calculated immediately**
2. User clicks Share button → **Modal opens instantly with validation results**
3. If map > 50MB → **Buttons disabled and warning shown immediately**
4. If map < 50MB → **Normal sharing flow with optimized compression quality**

### Technical Details
- Global storage prevents recalculation
- Async wrapper functions ensure non-blocking operation
- Error handling maintains application stability
- Console logging for debugging and monitoring
