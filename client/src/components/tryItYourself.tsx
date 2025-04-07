import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code, FileUp, Loader2, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObfuscationLevel } from "@/lib/obfuscate";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

export default function TryItYourself() {
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [obfuscationLevel, setObfuscationLevel] = useState<ObfuscationLevel>("medium");
  const { toast } = useToast();

  const obfuscateMutation = useMutation({
    mutationFn: async ({ code, level }: { code: string, level: ObfuscationLevel }) => {
      const res = await apiRequest("POST", "/api/obfuscate", { 
        code,
        level
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.obfuscatedCode) {
        // Create a blob and download link
        const blob = new Blob([data.obfuscatedCode], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file ? `obfuscated_${file.name}` : "obfuscated_code.lua";
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Obfuscation complete",
          description: `Your code has been obfuscated with ${data.level} protection.`,
        });
      } else if (!data.success) {
        toast({
          title: "Obfuscation failed",
          description: data.message || "Failed to obfuscate code",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Obfuscation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.lua')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a .lua file",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCode(content);
        setFile(selectedFile);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.lua')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCode(content);
        setFile(droppedFile);
      };
      reader.readAsText(droppedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .lua file",
        variant: "destructive",
      });
    }
  };

  const handleObfuscate = () => {
    if (!code.trim()) {
      toast({
        title: "Empty code",
        description: "Please enter some Lua code or upload a file",
        variant: "destructive",
      });
      return;
    }
    
    obfuscateMutation.mutate({ code, level: obfuscationLevel });
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h2 className="font-semibold text-lg mb-4">Try It Yourself</h2>
      
      <div className="bg-gray-800 rounded-md p-4 mb-4">
        <label className="block text-gray-400 mb-2">Paste your Lua code</label>
        <div className="relative">
          <Textarea 
            className="w-full bg-gray-900 text-gray-200 p-3 rounded-md border border-gray-700 focus:outline-none focus:border-indigo-500 min-h-[150px]"
            placeholder={`local function hello()\n    print('Hello, world!')\nend\n\nhello()`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-col space-y-3 mb-4">
        <label className="block text-gray-400">Obfuscation Level</label>
        <Select
          value={obfuscationLevel}
          onValueChange={(value) => setObfuscationLevel(value as ObfuscationLevel)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
            <SelectValue placeholder="Select obfuscation level" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
            <SelectGroup>
              <SelectLabel>Protection Level</SelectLabel>
              <SelectItem value="light" className="cursor-pointer">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-400" />
                  <span>Light - Basic protection</span>
                </div>
              </SelectItem>
              <SelectItem value="medium" className="cursor-pointer">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-yellow-400" />
                  <span>Medium - Standard protection</span>
                </div>
              </SelectItem>
              <SelectItem value="heavy" className="cursor-pointer">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-red-400" />
                  <span>Heavy - Maximum protection</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="flex-grow">
          <div 
            className="bg-gray-800 rounded-md p-4 h-full flex flex-col justify-center items-center border-2 border-dashed border-gray-700 hover:border-indigo-500 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              id="fileInput" 
              type="file" 
              accept=".lua" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <FileUp className="text-indigo-400 text-2xl mb-2 h-8 w-8" />
            <p className="text-center text-gray-400">Upload .lua file</p>
            <p className="text-center text-gray-400 text-xs mt-1">or drag and drop</p>
          </div>
        </div>
        <div className="sm:w-1/3">
          <Button
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-4 px-6 rounded-md transition-colors flex items-center justify-center h-full"
            onClick={handleObfuscate}
            disabled={obfuscateMutation.isPending}
          >
            {obfuscateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" />
                <span>Obfuscate</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
