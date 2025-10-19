
"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, FileSpreadsheet, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { downloadFile } from '@/lib/swagger-utils';

type SheetData = {
  headers: string[];
  rows: (string | number | boolean | null)[][];
};

export function ExcelReaderPanel() {
  const [sheets, setSheets] = useState<{ [key: string]: SheetData }>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const names = workbook.SheetNames;
        const sheetData: { [key: string]: SheetData } = {};

        names.forEach(name => {
          const worksheet = workbook.Sheets[name];
          const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (json.length > 0) {
            sheetData[name] = {
              headers: json[0] as string[],
              rows: json.slice(1),
            };
          } else {
             sheetData[name] = { headers: [], rows: [] };
          }
        });

        setSheets(sheetData);
        setSheetNames(names);
        setCurrentSheet(names[0] || '');
        setFileName(file.name);
        toast({ title: "File Loaded", description: `${file.name} has been processed.` });
      } catch (error) {
        console.error("Error processing Excel file:", error);
        toast({ variant: 'destructive', title: 'Processing Error', description: 'Could not read the Excel file. It might be corrupted or in an unsupported format.' });
      }
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'File Error', description: 'Failed to read the file.' });
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleReset = () => {
    setSheets({});
    setSheetNames([]);
    setCurrentSheet('');
    setFileName('');
  };

  const handleDownloadJson = () => {
    if (!currentSheet || !sheets[currentSheet]) return;
    const sheet = sheets[currentSheet];
    const jsonData = sheet.rows.map(row => {
      const obj: { [key: string]: any } = {};
      sheet.headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    const content = JSON.stringify(jsonData, null, 2);
    downloadFile(content, `${fileName.replace(/\.[^/.]+$/, "")}_${currentSheet}.json`, 'json');
  }

  const hasContent = sheetNames.length > 0;

  return (
    <div className="h-full flex flex-col p-4 gap-4 bg-muted/20">
      {hasContent ? (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">{fileName}</CardTitle>
              {sheetNames.length > 1 && (
                <Select value={currentSheet} onValueChange={setCurrentSheet}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <Button variant="outline" size="sm" onClick={handleDownloadJson}>
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
              <Button variant="ghost" size="icon" onClick={handleReset} title="Close file">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {sheets[currentSheet]?.headers.map((header, i) => (
                      <TableHead key={`${header}-${i}`}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheets[currentSheet]?.rows.map((row, i) => (
                    <TableRow key={`row-${i}`}>
                      {row.map((cell, j) => (
                        <TableCell key={`cell-${i}-${j}`}>{String(cell ?? '')}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div {...getRootProps()} className={cn("h-full w-full border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors", isDragActive && "border-primary bg-accent/20")}>
          <input {...getInputProps()} />
          <div className="text-center text-muted-foreground">
            <UploadCloud className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Upload an Excel File</h3>
            <p>Drag & drop a `.xlsx` or `.xls` file here, or click to select a file.</p>
          </div>
        </div>
      )}
    </div>
  );
}
