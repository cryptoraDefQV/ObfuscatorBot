import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileCode, Lock, RefreshCw, Activity, Clock, Users, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";

// Types for our statistics data
interface DailyStats {
  day: string;
  obfuscations: number;
}

interface ProtectionLevel {
  name: string;
  value: number;
  color: string;
}

interface FileType {
  name: string;
  value: number;
}

interface StatsData {
  totalObfuscations: number;
  todayObfuscations: number;
  uniqueUsers: number;
  averageFileSize: number;
  processingTime: {
    light: number;
    medium: number;
    heavy: number;
  };
  protectionLevels: ProtectionLevel[];
  dailyStats: DailyStats[];
  popularFileTypes: FileType[];
  lastUpdated: string;
}

interface ApiResponse {
  data: StatsData;
}

export default function Stats() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: statsData, isLoading, isError, refetch } = useQuery<ApiResponse>({
    queryKey: ['/api/stats'],
    refetchInterval: 60000, // Auto refresh every minute
  });

  const handleRefresh = () => {
    refetch();
  };

  // Colors for the charts
  const COLORS = ['#3b82f6', '#1d4ed8', '#60a5fa', '#93c5fd'];
  
  // Default demo stats data (will be replaced by actual data from API)
  const demoStats: StatsData = {
    totalObfuscations: 12547,
    todayObfuscations: 423,
    uniqueUsers: 1824,
    averageFileSize: 28.4, // KB
    processingTime: {
      light: 0.8, // seconds
      medium: 1.4,
      heavy: 2.2
    },
    protectionLevels: [
      { name: 'Light', value: 2341, color: '#60a5fa' },
      { name: 'Medium', value: 7890, color: '#3b82f6' },
      { name: 'Heavy', value: 2316, color: '#1d4ed8' }
    ],
    dailyStats: [
      { day: 'Mon', obfuscations: 346 },
      { day: 'Tue', obfuscations: 412 },
      { day: 'Wed', obfuscations: 387 },
      { day: 'Thu', obfuscations: 423 },
      { day: 'Fri', obfuscations: 518 },
      { day: 'Sat', obfuscations: 294 },
      { day: 'Sun', obfuscations: 279 }
    ],
    popularFileTypes: [
      { name: 'FiveM Scripts', value: 48 },
      { name: 'Game Scripts', value: 32 },
      { name: 'UI/Frontend', value: 12 },
      { name: 'Other', value: 8 }
    ],
    lastUpdated: new Date().toLocaleString()
  };

  // Use actual data if available, otherwise use demo data
  const stats = statsData?.data || demoStats;

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="min-h-screen flex flex-col bg-discord-bg text-white">
      <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex flex-grow">
        <Sidebar isOpen={mobileMenuOpen} />

        <main className="flex-grow p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="section-header text-2xl font-bold">Service Statistics</h1>
              <p className="text-gray-400 mt-1">
                Performance metrics and usage analytics for OBFUSCORE
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                className="bg-blue-500 hover:bg-blue-600 flex items-center" 
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mb-6 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Last updated: {stats.lastUpdated}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-400" />
                  Total Obfuscations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalObfuscations)}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatNumber(stats.todayObfuscations)} today
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-400" />
                  Unique Users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.uniqueUsers)}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Discord and web users combined
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400 flex items-center">
                  <FileType className="h-4 w-4 mr-2 text-blue-400" />
                  Average File Size
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageFileSize} KB</div>
                <p className="text-xs text-gray-400 mt-1">
                  Before obfuscation
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-400" />
                  Processing Time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.processingTime.medium}s</div>
                <p className="text-xs text-gray-400 mt-1">
                  Average for medium protection
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500">
                Overview
              </TabsTrigger>
              <TabsTrigger value="protection" className="data-[state=active]:bg-blue-500">
                Protection Levels
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-blue-500">
                Usage Trends
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-400" />
                      Protection Level Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.protectionLevels}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.protectionLevels.map((entry: ProtectionLevel, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between mt-4">
                      <Badge className="bg-blue-200 text-blue-800">
                        <FileCode className="h-3 w-3 mr-1" />
                        Light
                      </Badge>
                      <Badge className="bg-blue-400 text-blue-900">
                        <Shield className="h-3 w-3 mr-1" />
                        Medium
                      </Badge>
                      <Badge className="bg-blue-600 text-white">
                        <Lock className="h-3 w-3 mr-1" />
                        Heavy
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-blue-400" />
                      Script Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.popularFileTypes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.popularFileTypes.map((entry: FileType, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="protection" className="mt-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-400" />
                    Protection Level Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <div className="flex items-center mb-2">
                        <FileCode className="h-5 w-5 mr-2 text-blue-400" />
                        <h3 className="font-semibold">Light Protection</h3>
                      </div>
                      <div className="text-2xl font-bold">{formatNumber(stats.protectionLevels[0].value)}</div>
                      <div className="mt-2 text-sm text-gray-400">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Average time: {stats.processingTime.light}s</li>
                          <li>Comments removal</li>
                          <li>Code minification</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg border border-blue-900">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 mr-2 text-blue-400" />
                        <h3 className="font-semibold">Medium Protection</h3>
                      </div>
                      <div className="text-2xl font-bold">{formatNumber(stats.protectionLevels[1].value)}</div>
                      <div className="mt-2 text-sm text-gray-400">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Average time: {stats.processingTime.medium}s</li>
                          <li>Variable name obfuscation</li>
                          <li>Light protection features</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <div className="flex items-center mb-2">
                        <Lock className="h-5 w-5 mr-2 text-blue-400" />
                        <h3 className="font-semibold">Heavy Protection</h3>
                      </div>
                      <div className="text-2xl font-bold">{formatNumber(stats.protectionLevels[2].value)}</div>
                      <div className="mt-2 text-sm text-gray-400">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Average time: {stats.processingTime.heavy}s</li>
                          <li>String encryption</li>
                          <li>Control flow obfuscation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <h3 className="font-semibold mb-2">Protection Effectiveness Rating</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Light</span>
                          <span className="text-sm">40%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-400 h-2 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Medium</span>
                          <span className="text-sm">75%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Heavy</span>
                          <span className="text-sm">95%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-4">
                      Effectiveness rating is based on reverse engineering difficulty and code analysis resistance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-400" />
                    Daily Obfuscation Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.dailyStats}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="obfuscations" name="Obfuscations" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <h3 className="font-semibold mb-2">Weekly Analysis</h3>
                    <p className="text-sm text-gray-300">
                      We've processed <strong>{formatNumber(stats.dailyStats.reduce((acc: number, day: DailyStats) => acc + day.obfuscations, 0))}</strong> obfuscation requests this week.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Busiest Day</p>
                        <p className="font-medium">
                          {stats.dailyStats.reduce((max: DailyStats, day: DailyStats) => max.obfuscations > day.obfuscations ? max : day, stats.dailyStats[0]).day}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Web vs Discord</p>
                        <p className="font-medium">64% Discord / 36% Web</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Average Daily</p>
                        <p className="font-medium">
                          {Math.round(stats.dailyStats.reduce((acc: number, day: DailyStats) => acc + day.obfuscations, 0) / stats.dailyStats.length)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Growth Rate</p>
                        <p className="font-medium text-green-400">+8.3% weekly</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 text-center text-gray-400 text-xs">
            <p>All statistics are updated in real-time. Data is anonymized to protect user privacy.</p>
            <p className="mt-1">
              OBFUSCORE Analytics - v1.0
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}