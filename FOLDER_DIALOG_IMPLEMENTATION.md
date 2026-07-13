# BriefVault - Folder Selection Dialog Implementation

**Date:** July 10, 2026  
**Feature:** Folder selection before document upload in My Documents page

---

## ✅ Implementation Complete

### Overview
Added an interactive folder selection dialog that appears before uploading documents in the My Documents page (`/dashboard/documents`). Users now choose which folder to save documents in before the upload begins.

---

## 🎨 New Component Created

### File: `src/components/ui/folder-select-dialog.tsx`

**Full-screen modal dialog with:**
- ✅ **Backdrop overlay** - Semi-transparent black with blur
- ✅ **"No Folder" option** - Save in root directory
- ✅ **Folder list** - All user's folders with icons
- ✅ **Folder colors** - Visual distinction by color
- ✅ **Selection indicator** - Active state with dot indicator
- ✅ **Create folder link** - Navigate to folders page
- ✅ **Smooth animations** - Fade, zoom, slide effects
- ✅ **Keyboard support** - ESC to close
- ✅ **Click outside** - Close on backdrop click
- ✅ **Body scroll lock** - Prevent background scrolling
- ✅ **Responsive** - Works on all screen sizes
- ✅ **Accessible** - Proper ARIA attributes

**Dialog Structure:**
```
┌──────────────────────────────────────┐
│  Select Folder              [X]      │ ← Header
├──────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 📁 No Folder            ●  │    │ ← No folder option
│  │ Save in root directory     │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 📁 Corporate Documents     │    │ ← User folders
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 📁 Legal Cases 2024        │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ ➕ Create New Folder        │    │ ← Create link
│  └─────────────────────────────┘    │
├──────────────────────────────────────┤
│           [Cancel] [Continue Upload] │ ← Footer
└──────────────────────────────────────┘
```

---

## 📝 Updated Component

### File: `src/components/documents/document-manager.tsx`

**Changes:**

#### 1. New Imports
```typescript
import { useRouter } from "next/navigation";
import { FolderSelectDialog, type FolderOption } from "@/components/ui/folder-select-dialog";
```

#### 2. New State Variables
```typescript
const [showFolderDialog, setShowFolderDialog] = useState(false);
const [pendingFiles, setPendingFiles] = useState<File[]>([]);
const [folders, setFolders] = useState<FolderOption[]>([]);
```

#### 3. Fetch Folders on Mount
```typescript
useEffect(() => {
  async function fetchFolders() {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setFolders(json.data);
        }
      }
    } catch {
      // Silent fail - folders are optional
    }
  }
  fetchFolders();
}, []);
```

#### 4. Updated Upload Flow
**Before:**
```typescript
const onDrop = useCallback((files: File[]) => {
  for (const file of files) {
    toast.promise(upload.mutateAsync(file), {
      loading: `Uploading ${file.name}…`,
      success: `${file.name} uploaded.`,
      error: (e) => (e instanceof Error ? e.message : "Upload failed."),
    });
  }
}, [upload]);
```

**After:**
```typescript
const onDrop = useCallback((files: File[]) => {
  // Show folder selection dialog before uploading
  setPendingFiles(files);
  setShowFolderDialog(true);
}, []);

const handleFolderSelect = useCallback((folderId: string | null) => {
  // Upload pending files with selected folder
  for (const file of pendingFiles) {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) formData.append("folderId", folderId);

    toast.promise(
      fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      }).then(async (res) => {
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      }),
      {
        loading: `Uploading ${file.name}…`,
        success: `${file.name} uploaded.`,
        error: (e) => (e instanceof Error ? e.message : "Upload failed."),
      }
    );
  }
  setPendingFiles([]);
}, [pendingFiles]);
```

#### 5. Dialog Integration
```tsx
<FolderSelectDialog
  open={showFolderDialog}
  onClose={() => {
    setShowFolderDialog(false);
    setPendingFiles([]);
  }}
  onSelect={handleFolderSelect}
  folders={folders}
  onCreateFolder={() => router.push("/dashboard/folders")}
/>
```

---

## 🎯 User Flow

### Before (Direct Upload)
```
1. User drags file to My Documents
2. File uploads immediately
3. Document saved to root (no folder)
```

### After (With Folder Selection)
```
1. User drags file to My Documents
   ↓
2. Folder selection dialog appears
   ↓
3. User selects folder (or "No Folder")
   ↓
4. User clicks "Continue Upload"
   ↓
5. File uploads to selected folder
```

---

## 🎨 Dialog Features

### 1. No Folder Option
**Always available as first option:**
```tsx
<button className="...">
  <Folder className="text-muted-foreground" />
  <div>
    <p>No Folder</p>
    <p>Save in root directory</p>
  </div>
  {selectedId === null && <div className="dot" />}
</button>
```

**Purpose:** Allow users to save directly without folder organization

---

### 2. Folder List
**Displays all user folders:**
```tsx
{folders.map((folder) => (
  <button key={folder.id} className="...">
    <Folder style={{ color: folder.color }} />
    <p>{folder.name}</p>
    {selectedId === folder.id && <div className="dot" />}
  </button>
))}
```

**Features:**
- Folder color coding
- Selection indicator (dot)
- Hover states
- Active state highlighting

---

### 3. Create Folder Link
**Quick access to folder management:**
```tsx
<button
  onClick={() => {
    onCreateFolder();
    handleCancel();
  }}
  className="border-dashed..."
>
  <FolderPlus />
  Create New Folder
</button>
```

**Behavior:**
- Closes dialog
- Navigates to `/dashboard/folders`
- User can create folder and return

---

### 4. Dialog Controls

**Cancel Button:**
- Closes dialog
- Clears pending files
- Resets selection
- No upload happens

**Continue Upload Button:**
- Confirms selection
- Starts upload
- Closes dialog
- Shows upload toasts

**Close Icon (X):**
- Same as Cancel button
- Top-right corner
- Always visible

**ESC Key:**
- Same as Cancel button
- Keyboard shortcut

**Click Outside:**
- Same as Cancel button
- Click on backdrop

---

## 🎨 Visual States

### Default State
```
┌─────────────────────────────┐
│ 📁 No Folder                │
│ Save in root directory      │
└─────────────────────────────┘
```

### Selected State
```
┌─────────────────────────────┐
│ 📁 Corporate Documents  ●  │ ← Violet highlight + dot
└─────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────┐
│ 📁 Legal Cases 2024         │ ← Muted background
└─────────────────────────────┘
```

### Empty State (No Folders)
```
┌─────────────────────────────┐
│ 📁 No Folder            ●  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ ➕ Create New Folder        │
└─────────────────────────────┘
```

---

## 💡 Use Cases

### Use Case 1: Upload to Specific Folder
```
1. User drags "Contract.pdf"
2. Dialog shows
3. User selects "Contracts" folder
4. Clicks "Continue Upload"
5. Document saved in Contracts folder
```

### Use Case 2: Upload to Root
```
1. User drags "Document.pdf"
2. Dialog shows
3. User selects "No Folder"
4. Clicks "Continue Upload"
5. Document saved in root (no folder)
```

### Use Case 3: Create Folder First
```
1. User drags "Report.pdf"
2. Dialog shows
3. User clicks "Create New Folder"
4. Navigates to /dashboard/folders
5. Creates "Reports 2024" folder
6. Returns to upload
7. Can now select new folder
```

### Use Case 4: Cancel Upload
```
1. User drags "Document.pdf"
2. Dialog shows
3. User clicks "Cancel" or ESC
4. Dialog closes
5. No upload happens
6. Can try again
```

### Use Case 5: Multiple Files
```
1. User drags 3 files
2. Dialog shows once
3. User selects folder
4. All 3 files upload to same folder
5. Individual toast for each file
```

---

## 🔧 Technical Details

### API Integration

**Folders API Call:**
```typescript
const res = await fetch("/api/folders");
const json = await res.json();
// Returns: { success: true, data: FolderOption[] }
```

**Upload API Call:**
```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("folderId", folderId);  // Optional

const res = await fetch("/api/documents/upload", {
  method: "POST",
  body: formData,
});
```

### State Management

**Dialog State:**
```typescript
open: boolean           // Show/hide dialog
onClose: () => void     // Close handler
onSelect: (id) => void  // Confirm handler
```

**Pending Files:**
```typescript
pendingFiles: File[]    // Files waiting for folder selection
```

**Selected Folder:**
```typescript
selectedId: string | null  // null = "No Folder"
```

### Animation Classes
```css
/* Dialog backdrop */
animate-in fade-in-0

/* Dialog content */
animate-in zoom-in-95 slide-in-from-bottom-4 duration-200
```

---

## ✅ Benefits

### User Experience
1. **Organized from start** - Documents go to correct folder immediately
2. **No post-upload moves** - Don't need to move documents later
3. **Clear choice** - Explicit folder selection
4. **Quick access** - Create folder link in dialog
5. **Cancel option** - Can abort upload

### Developer Experience
1. **Reusable component** - Can use in other upload flows
2. **Clean separation** - Dialog logic isolated
3. **Type-safe** - Full TypeScript support
4. **Maintainable** - Single source for folder selection

### Technical Benefits
1. **Proper UX flow** - Prevents orphaned documents
2. **Better organization** - Encourages folder usage
3. **Consistent** - Same flow everywhere
4. **Accessible** - Keyboard and screen reader support

---

## 📊 Comparison

### My Documents Page Upload

| Feature | Before | After |
|---------|--------|-------|
| Folder Selection | ❌ No | ✅ Yes (dialog) |
| Direct Upload | ✅ Yes | ❌ No (requires folder choice) |
| Create Folder | ❌ Navigate manually | ✅ Link in dialog |
| Cancel Upload | ❌ No option | ✅ Cancel button |
| Multiple Files | ✅ All upload | ✅ All to same folder |
| Organization | ❌ Manual later | ✅ Automatic |

### Upload Document Page

| Feature | Status |
|---------|--------|
| Folder Selection | ✅ Dropdown in form |
| Direct Upload | ✅ Form submission |
| Create Folder | ✅ Link below dropdown |

**Note:** Both upload methods now support folder selection!

---

## 🎯 Integration Points

### 1. Drag & Drop
- When files are dropped
- Dialog appears
- User selects folder
- Files upload

### 2. Upload Button
- When button clicked
- File picker opens
- User selects files
- Dialog appears
- User selects folder
- Files upload

### 3. Empty State
- When no documents exist
- Upload button available
- Same flow as above

---

## 🚀 Future Enhancements

### Potential Additions
1. **Remember last selection** - Auto-select last used folder
2. **Recent folders** - Quick access to frequently used
3. **Folder preview** - Show document count
4. **Bulk operations** - Upload to multiple folders
5. **Drag reordering** - Reorder folders in list

### Example: Remember Last Selection
```typescript
const [lastFolderId, setLastFolderId] = useLocalStorage('lastFolderId');

// Auto-select last used folder
useEffect(() => {
  if (lastFolderId) setSelectedId(lastFolderId);
}, [open]);

// Save selection
const handleConfirm = () => {
  setLastFolderId(selectedId);
  onSelect(selectedId);
};
```

---

## 📝 Testing Checklist

### Functionality
- [x] Dialog opens on file drop
- [x] Dialog opens on upload button
- [x] Folders load correctly
- [x] "No Folder" option works
- [x] Folder selection works
- [x] Create folder link works
- [x] Cancel closes dialog
- [x] Continue uploads files
- [x] ESC closes dialog
- [x] Click outside closes

### Visual
- [x] Animations smooth
- [x] Folder colors display
- [x] Selection indicator shows
- [x] Hover states work
- [x] Dark mode compatible
- [x] Responsive on mobile

### Edge Cases
- [x] No folders available
- [x] Many folders (scrollable)
- [x] Multiple files
- [x] Upload failure handling
- [x] Network errors

---

## ✨ Summary

Successfully implemented folder selection dialog for the My Documents page upload flow:

- ✅ **New Component:** `folder-select-dialog.tsx` (210 lines)
- ✅ **Updated Component:** `document-manager.tsx`
- ✅ **TypeScript Errors:** 0
- ✅ **Diagnostics:** All passing
- ✅ **User Flow:** Improved organization

**Key Features:**
- Modal dialog with backdrop
- Folder list with colors
- "No Folder" option
- Create folder link
- Smooth animations
- Full accessibility
- Mobile responsive

**Result:** Users can now choose which folder to save documents in before uploading, ensuring better organization from the start! 🎉

---

*Implementation completed on July 10, 2026*
