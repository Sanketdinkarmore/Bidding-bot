import type React from "react";
import { memo, useCallback, useRef, useState } from "react";

import { Upload } from "lucide-react";

import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ExcelFilePickerProps {
  handleFileChange: (file: File | null) => void;
}

const ExcelFilePicker = ({ handleFileChange }: ExcelFilePickerProps) => {
  const maxSize = 30;

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if file is an Excel file
  const isExcelFile = useCallback((file: File) => {
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.oasis.opendocument.spreadsheet",
      ".xlsx",
      ".xls",
      ".ods",
    ];
    return (
      allowedTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".ods")
    );
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileInput = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>,
    ) => {
      e.preventDefault();
      e.stopPropagation();

      setDragActive(false);

      // Get the file from the event
      let file: File | null = null;
      if ("dataTransfer" in e) {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          file = e.dataTransfer.files[0];
        }
      } else if (e.target.files && e.target.files.length > 0) {
        file = e.target.files[0];
      }

      // Validate and process the file
      if (file) {
        // Check file type
        if (!isExcelFile(file)) {
          toast.error("Please upload an Excel file (.xlsx, .xls, or .ods)");
          return;
        }

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`File size should not exceed ${maxSize} MB`);
          return;
        }

        handleFileChange(file);
      }
    },
    [maxSize, toast, isExcelFile],
  );

  // Reset the upload
  const resetUpload = () => {
    handleFileChange(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Click to select file
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-300",
          dragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-500 bg-white hover:bg-white",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleFileInput}
      >
        <>
          {/* Upload Icon & Text */}
          <div className="flex flex-col items-center gap-4 p-4">
            <div
              className={cn(
                "rounded-full p-4 transition-colors",
                dragActive
                  ? "bg-blue-500/20 text-blue-500"
                  : "bg-secondary text-blue-500/80",
              )}
            >
              <Upload
                size={28}
                className="transform transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="font-semibold text-lg text-black">Upload Excel File</h3>
              <p className="max-w-xs text-gray-500 text-sm">
                Drag & drop your Excel file here, or click to browse
              </p>
              <p className="text-gray-500 text-xs">
                Supports .xlsx, .xls files up to {maxSize}MB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleButtonClick}
            className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-blue-500-foreground transition-colors duration-200 hover:bg-blue-500/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Browse Files
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.ods,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet"
            onChange={handleFileInput}
            tabIndex={-1}
          />
        </>
      </div>
    </div>
  );
};

export default memo(ExcelFilePicker);
