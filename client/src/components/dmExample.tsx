import { Code, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DmExample() {
  const obfuscatedCodeExample = `local a=string.byte;local b=string.char;local c=string.sub;local d=table.concat;local e=math.ldexp;local f=getfenv or function()return _ENV end;local g=setmetatable;local h=select;local i=unpack;local j=tonumber;local function k(l)local m,n,o="","",{}local p=256;local q={}for r=0,p-1 do q[r]=b(r)end;local r=1;local function s()local t=j(c(l,r,r),36)r=r+1;local u=j(c(l,r,r+t-1),36)r=r+t;return u end;m=b(s())o[1]=m;while r<#l do local r=s()if q[r]then n=q[r]else n=m..c(m,1,1)end;q[p]=m..c(n,1,1)o[#o+1],m,p=n,n,p+1 end;return table.concat(o)end;local function l(...)return{...},h('#',...)end;local function m()local n={};local o={};local p={};local q={n,o,nil,p};local r={}local s={}local t={}for u=1,h('#',...)-1 do if u>=6 then s[u-5]=h(u,...)else t[u]=h(u,...)end end;s[-1]=t;s[-2]=q;s[-3]=r;local u=1;local v=1;while true do local w=a(c(q[1],u,u),1)u=u+1;if w==1 then break end end;return q[3]end;return m()`;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-4">
        <Mail className="text-indigo-400 mr-2 h-5 w-5" />
        <h2 className="font-semibold text-lg">Direct Message Example</h2>
      </div>
      
      <div className="flex mb-4">
        <div className="w-10 h-10 rounded-full flex-shrink-0 mr-3 overflow-hidden">
          <div className="bg-indigo-500 w-full h-full flex items-center justify-center">
            <Code className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center">
            <span className="font-medium text-indigo-400">LuaObfuscatorBot</span>
            <span className="bg-indigo-500 text-white text-xs px-1 rounded ml-2">BOT</span>
            <span className="text-gray-400 text-xs ml-2">Today at 12:34 PM</span>
          </div>
          <div className="mt-1 text-gray-300">
            <p className="mb-2">Here's your obfuscated Lua code:</p>
            <div className="bg-[#282C34] rounded-md p-3 max-h-80 overflow-y-auto">
              <pre>
                <code className="text-sm text-gray-200 font-mono whitespace-pre-wrap break-words">
                  {obfuscatedCodeExample}
                </code>
              </pre>
            </div>
            <div className="bg-gray-900 mt-3 rounded p-3 border border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Download className="text-indigo-400 mr-2 h-4 w-4" />
                  <span>obfuscated_script.lua</span>
                </div>
                <Button 
                  className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded text-white text-sm transition-colors"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
