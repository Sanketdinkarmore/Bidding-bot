import { useState } from 'react';
import { Download, Loader2Icon, Upload } from 'lucide-react';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExcelFilePicker from './ExcelFilePicker';
import { toast } from '@/lib/toast';

interface UploadedFile {
  file: File;
  progress: number;
  status: "reading" | "validating" | "parsing" | "complete" | "error";
}


function UploadBrokerMasterDialog() {
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

    const handleFileChange = (file: File | null) => {
        if (!file) {
            setUploadedFile(null);
            return;
        }

        const uploadedFile: UploadedFile = {
            file,
            status: "reading",
            progress: 0,
        };

        setUploadedFile(uploadedFile);

        handleUpload(file)
    };

    const handleDownload = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");

        worksheet.addRow([
            "Sr.No",	
            "Challan No",
            "Challan Entry Time Stamp",
            "Route Type",
            "Placement Source",
            "Vehicle No",
            "FTLType",
            "Challan Origin Control Branch",
            "Challan Destination Control Branch",
            "Challan Origin City",
            "Challan Destination City",
            "Challan Total Distance",
            "Challan Amount",
            "Broker Name",
            "Broker Mobile",
            "Broker Pan No",
            "Logical Vendor",
            "GCNOs",
            "Traffic Incharge User Id",
            "Traffic Incharge Name",
            "Traffic Incharge Branch",
            "Total TDS Amount",
            "Balance Amount",
            "Balance Location",
        ]);

        const buf = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        saveAs(blob, "broker_master_template.xlsx");
    }

    const handleUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("file", file)
    
            const response = await fetch("/api/master/upload-excel", {
              method: "POST",
              body: formData,
            });
    
            if (!response.ok) {
              setUploadedFile(null)
              throw new Error("Failed to upload")
            }

            setUploadedFile(null)
            toast.success("file uploaded successfully")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to upload")
        } finally {
            setUploadedFile(null)
        }
    }

    return (
        <Dialog>
            <DialogTrigger>
                <div
                    // onClick={handleDownload}
                    className="group flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-black text-sm transition-all duration-200 border-[1px] border-gray-500 hover:text-blue-500 hover:border-blue-500"
                >
                    <Upload
                    size={18}
                    className="group-hover:-translate-y-0.5 transition-transform duration-200"
                    />
                    <span>Upload Broker Master</span>
                </div>
            </DialogTrigger>

            <DialogContent className="overflow-hidden bg-white">
                <DialogHeader className='flex justify-between'>
                    <div className='flex justify-between mb-2'>
                        <DialogTitle className='text-black'>Upload Broker Master</DialogTitle>
                        <button
                            onClick={handleDownload}
                            className="group flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-black text-sm transition-all duration-200 border-[1px] border-gray-500 hover:text-blue-500 hover:border-blue-500"
                        >
                            <Download
                                size={18}
                                className="group-hover:-translate-y-0.5 transition-transform duration-200"
                            />
                            <span>Download Master Template</span>
                        </button>
                    </div>
                </DialogHeader>

                <div>
                    {!uploadedFile && <ExcelFilePicker handleFileChange={handleFileChange}/>}
                    {uploadedFile && <div className='h-[350px] text-black w-full flex items-center justify-center'>
                        <p>Uploading...</p>
                        <Loader2Icon className='h-5 w-5 animate-spin' />
                        </div>}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default UploadBrokerMasterDialog

