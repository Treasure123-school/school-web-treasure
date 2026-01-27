import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, AlertTriangle, GraduationCap, BarChart3, Settings2, FileText, Eye, Trash2, Plus, X, Phone, Mail, Building2, Globe, Image } from "lucide-react";
import { GRADING_SCALES, getGradeColor, getGradeBgColor, type GradingConfig } from "@shared/grading-utils";

interface SettingsData {
  schoolName: string;
  schoolShortName: string;
  schoolMotto: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolLogo?: string;
  favicon?: string;
  schoolPhones: string;
  schoolEmails: string;
  websiteTitle: string;
  footerText: string;
  maintenanceMode: boolean;
  maintenanceModeMessage: string;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
  enableExamsModule: boolean;
  enableAttendanceModule: boolean;
  enableResultsModule: boolean;
  themeColor: string;
  hideAdminAccountsFromAdmins: boolean;
  testWeight: number;
  examWeight: number;
  defaultGradingScale: string;
  autoCreateReportCard: boolean;
  scoreAggregationMode: string;
  showGradeBreakdown: boolean;
  allowTeacherOverrides: boolean;
  deletedUserRetentionDays: number;
}

interface PhoneEntry {
  countryCode: string;
  number: string;
}

const COUNTRY_CODES = [
  { code: "+234", country: "Nigeria", flag: "NG" },
  { code: "+1", country: "USA/Canada", flag: "US" },
  { code: "+44", country: "United Kingdom", flag: "GB" },
  { code: "+233", country: "Ghana", flag: "GH" },
  { code: "+27", country: "South Africa", flag: "ZA" },
  { code: "+254", country: "Kenya", flag: "KE" },
  { code: "+91", country: "India", flag: "IN" },
  { code: "+86", country: "China", flag: "CN" },
  { code: "+61", country: "Australia", flag: "AU" },
  { code: "+49", country: "Germany", flag: "DE" },
  { code: "+33", country: "France", flag: "FR" },
  { code: "+39", country: "Italy", flag: "IT" },
  { code: "+34", country: "Spain", flag: "ES" },
  { code: "+55", country: "Brazil", flag: "BR" },
  { code: "+81", country: "Japan", flag: "JP" },
  { code: "+82", country: "South Korea", flag: "KR" },
  { code: "+971", country: "UAE", flag: "AE" },
  { code: "+966", country: "Saudi Arabia", flag: "SA" },
  { code: "+20", country: "Egypt", flag: "EG" },
  { code: "+212", country: "Morocco", flag: "MA" },
];

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: settings, refetch } = useQuery<SettingsData>({
    queryKey: ["/api/superadmin/settings"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchInterval: 5000, // Added polling for real-time updates
  });

  const [formData, setFormData] = useState<SettingsData & { schoolLogo?: string; favicon?: string }>({
    schoolName: "",
    schoolShortName: "",
    schoolMotto: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    schoolLogo: "",
    favicon: "",
    schoolPhones: "[]",
    schoolEmails: "[]",
    websiteTitle: "",
    footerText: "",
    maintenanceMode: false,
    maintenanceModeMessage: "",
    enableSmsNotifications: false,
    enableEmailNotifications: true,
    enableExamsModule: true,
    enableAttendanceModule: true,
    enableResultsModule: true,
    themeColor: "blue",
    hideAdminAccountsFromAdmins: true,
    testWeight: 40,
    examWeight: 60,
    defaultGradingScale: "standard",
    autoCreateReportCard: true,
    scoreAggregationMode: "last",
    showGradeBreakdown: true,
    allowTeacherOverrides: true,
    deletedUserRetentionDays: 30,
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("uploadType", "system_settings");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, schoolLogo: data.url }));
        toast({ title: "Logo uploaded", description: "Save changes to apply the new logo." });
      } else {
        setFormData(prev => ({ ...prev, favicon: data.url }));
        toast({ title: "Favicon uploaded", description: "Save changes to apply the new favicon." });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const parsePhones = (phonesJson: string): PhoneEntry[] => {
    try {
      const parsed = JSON.parse(phonesJson || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseEmails = (emailsJson: string): string[] => {
    try {
      const parsed = JSON.parse(emailsJson || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const addPhone = () => {
    const phones = parsePhones(formData.schoolPhones);
    phones.push({ countryCode: "+234", number: "" });
    setFormData({ ...formData, schoolPhones: JSON.stringify(phones) });
  };

  const updatePhone = (index: number, field: keyof PhoneEntry, value: string) => {
    const phones = parsePhones(formData.schoolPhones);
    if (phones[index]) {
      phones[index][field] = value;
      setFormData({ ...formData, schoolPhones: JSON.stringify(phones) });
    }
  };

  const removePhone = (index: number) => {
    const phones = parsePhones(formData.schoolPhones);
    phones.splice(index, 1);
    setFormData({ ...formData, schoolPhones: JSON.stringify(phones) });
  };

  const addEmail = () => {
    const emails = parseEmails(formData.schoolEmails);
    emails.push("");
    setFormData({ ...formData, schoolEmails: JSON.stringify(emails) });
  };

  const updateEmail = (index: number, value: string) => {
    const emails = parseEmails(formData.schoolEmails);
    emails[index] = value;
    setFormData({ ...formData, schoolEmails: JSON.stringify(emails) });
  };

  const removeEmail = (index: number) => {
    const emails = parseEmails(formData.schoolEmails);
    emails.splice(index, 1);
    setFormData({ ...formData, schoolEmails: JSON.stringify(emails) });
  };

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
        schoolLogo: settings.schoolLogo || "",
        favicon: settings.favicon || "",
        schoolShortName: settings.schoolShortName || "",
        schoolPhones: settings.schoolPhones || "[]",
        schoolEmails: settings.schoolEmails || "[]",
        websiteTitle: settings.websiteTitle || "",
        footerText: settings.footerText || "",
        testWeight: settings.testWeight ?? 40,
        examWeight: settings.examWeight ?? 60,
        defaultGradingScale: settings.defaultGradingScale ?? "standard",
        autoCreateReportCard: settings.autoCreateReportCard ?? true,
        scoreAggregationMode: settings.scoreAggregationMode ?? "last",
        showGradeBreakdown: settings.showGradeBreakdown ?? true,
        allowTeacherOverrides: settings.allowTeacherOverrides ?? true,
        deletedUserRetentionDays: settings.deletedUserRetentionDays ?? 30,
      }));
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      return apiRequest("PUT", "/api/superadmin/settings", data);
    },
    onSuccess: (updatedSettings: any) => {
      toast({ title: "Success", description: "Settings saved successfully" });
      
      // Update the cache immediately with the returned data
      queryClient.setQueryData(["/api/superadmin/settings"], updatedSettings);
      queryClient.setQueryData(["/api/public/settings"], updatedSettings);
      
      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grading-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "public", "homepage-content"] });
      
      // Force a refetch to be absolutely sure
      queryClient.refetchQueries({ queryKey: ["/api/superadmin/settings"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    },
  });

  const handleSave = () => {
    if (formData.testWeight + formData.examWeight !== 100) {
      toast({
        title: "Validation Error",
        description: "Test Weight and Exam Weight must add up to 100%",
        variant: "destructive",
      });
      return;
    }
    
    // Create a clean object to send, ensuring no extra fields that might cause issues
    const dataToSave = {
      schoolName: formData.schoolName,
      schoolShortName: formData.schoolShortName,
      schoolMotto: formData.schoolMotto,
      schoolEmail: formData.schoolEmail,
      schoolPhone: formData.schoolPhone,
      schoolAddress: formData.schoolAddress,
      schoolLogo: formData.schoolLogo,
      favicon: formData.favicon,
      schoolPhones: formData.schoolPhones,
      schoolEmails: formData.schoolEmails,
      websiteTitle: formData.websiteTitle,
      footerText: formData.footerText,
      maintenanceMode: formData.maintenanceMode,
      maintenanceModeMessage: formData.maintenanceModeMessage,
      enableSmsNotifications: formData.enableSmsNotifications,
      enableEmailNotifications: formData.enableEmailNotifications,
      enableExamsModule: formData.enableExamsModule,
      enableAttendanceModule: formData.enableAttendanceModule,
      enableResultsModule: formData.enableResultsModule,
      themeColor: formData.themeColor,
      hideAdminAccountsFromAdmins: formData.hideAdminAccountsFromAdmins,
      testWeight: formData.testWeight,
      examWeight: formData.examWeight,
      defaultGradingScale: formData.defaultGradingScale,
      autoCreateReportCard: formData.autoCreateReportCard,
      scoreAggregationMode: formData.scoreAggregationMode,
      showGradeBreakdown: formData.showGradeBreakdown,
      allowTeacherOverrides: formData.allowTeacherOverrides,
      deletedUserRetentionDays: formData.deletedUserRetentionDays,
    };

    saveSettingsMutation.mutate(dataToSave, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleTestWeightChange = (value: string) => {
    const testWeight = Math.min(100, Math.max(0, parseInt(value) || 0));
    const examWeight = 100 - testWeight;
    setFormData({ ...formData, testWeight, examWeight });
  };

  const handleExamWeightChange = (value: string) => {
    const examWeight = Math.min(100, Math.max(0, parseInt(value) || 0));
    const testWeight = 100 - examWeight;
    setFormData({ ...formData, testWeight, examWeight });
  };

  const weightsValid = formData.testWeight + formData.examWeight === 100;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white" data-testid="text-page-title">
              System Settings
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Configure global system settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    if (settings) setFormData({ ...formData, ...settings });
                  }}
                  data-testid="button-cancel-settings"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saveSettingsMutation.isPending || !weightsValid}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-edit-settings"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            )}
          </div>
        </div>

        <div className={`grid gap-6 ${!isEditing ? "opacity-90 pointer-events-none select-none" : ""}`}>
          {/* School Information */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Building2 className="h-5 w-5" />
                School Information
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Basic information about your school - these details appear on the website and official documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo and Favicon Section */}
              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                {/* School Logo */}
                <div className="flex flex-col items-center">
                  <Label className="text-sm font-medium mb-2 dark:text-slate-200">School Logo</Label>
                  <div className="w-28 h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-white dark:bg-slate-800">
                    {formData.schoolLogo ? (
                      <img 
                        src={formData.schoolLogo} 
                        alt="School Logo" 
                        className="w-full h-full object-contain"
                        data-testid="img-school-logo"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Image className="h-8 w-8 mx-auto text-slate-400" />
                        <span className="text-xs text-slate-500 mt-1">No logo</span>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <Label htmlFor="logo-upload" className="cursor-pointer mt-2">
                      <div className="text-xs text-blue-600 hover:text-blue-700 font-medium text-center">
                        {uploadingLogo ? "Uploading..." : "Upload Logo"}
                      </div>
                      <Input 
                        id="logo-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        disabled={uploadingLogo}
                        data-testid="input-logo-upload"
                      />
                    </Label>
                  )}
                </div>

                {/* Favicon */}
                <div className="flex flex-col items-center">
                  <Label className="text-sm font-medium mb-2 dark:text-slate-200">Favicon</Label>
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-white dark:bg-slate-800">
                    {formData.favicon ? (
                      <img 
                        src={formData.favicon} 
                        alt="Favicon" 
                        className="w-full h-full object-contain"
                        data-testid="img-favicon"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Globe className="h-5 w-5 mx-auto text-slate-400" />
                        <span className="text-[10px] text-slate-500">Icon</span>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <Label htmlFor="favicon-upload" className="cursor-pointer mt-2">
                      <div className="text-xs text-blue-600 hover:text-blue-700 font-medium text-center">
                        {uploadingFavicon ? "Uploading..." : "Upload Favicon"}
                      </div>
                      <Input 
                        id="favicon-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,.ico"
                        onChange={(e) => handleFileUpload(e, 'favicon')}
                        disabled={uploadingFavicon}
                        data-testid="input-favicon-upload"
                      />
                    </Label>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1 text-center max-w-[100px]">
                    Browser tab icon (16x16 or 32x32 px)
                  </p>
                </div>
              </div>

              {/* Basic Info Section */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolName" className="dark:text-slate-200">School Name *</Label>
                  <Input
                    id="schoolName"
                    data-testid="input-school-name"
                    value={formData.schoolName}
                    readOnly={!isEditing}
                    placeholder="e.g. Treasure-Home School"
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolShortName" className="dark:text-slate-200">School Short Name / Acronym</Label>
                  <Input
                    id="schoolShortName"
                    data-testid="input-school-short-name"
                    value={formData.schoolShortName}
                    readOnly={!isEditing}
                    placeholder="e.g. THS"
                    onChange={(e) => setFormData({ ...formData, schoolShortName: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolMotto" className="dark:text-slate-200">School Motto</Label>
                <Input
                  id="schoolMotto"
                  data-testid="input-school-motto"
                  value={formData.schoolMotto}
                  readOnly={!isEditing}
                  placeholder="e.g. Honesty and Success"
                  onChange={(e) => setFormData({ ...formData, schoolMotto: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolAddress" className="dark:text-slate-200">School Address</Label>
                <Textarea
                  id="schoolAddress"
                  data-testid="input-school-address"
                  value={formData.schoolAddress}
                  readOnly={!isEditing}
                  placeholder="e.g. 123 Education Street, City, State, Country"
                  onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-white min-h-[80px]"
                />
              </div>

              {/* Phone Numbers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="dark:text-slate-200 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Numbers
                  </Label>
                  {isEditing && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addPhone}
                      data-testid="button-add-phone"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Phone
                    </Button>
                  )}
                </div>
                {parsePhones(formData.schoolPhones).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No phone numbers added. Click "Add Phone" to add one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {parsePhones(formData.schoolPhones).map((phone, index) => (
                      <div key={index} className="flex items-center gap-2" data-testid={`phone-entry-${index}`}>
                        <Select
                          disabled={!isEditing}
                          value={phone.countryCode}
                          onValueChange={(value) => updatePhone(index, 'countryCode', value)}
                        >
                          <SelectTrigger className="w-[140px] dark:bg-slate-900 dark:border-slate-700" data-testid={`select-country-code-${index}`}>
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((cc) => (
                              <SelectItem key={cc.code} value={cc.code}>
                                {cc.code} ({cc.flag})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="tel"
                          value={phone.number}
                          readOnly={!isEditing}
                          placeholder="Phone number"
                          onChange={(e) => updatePhone(index, 'number', e.target.value)}
                          className="flex-1 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid={`input-phone-number-${index}`}
                        />
                        {isEditing && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removePhone(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            data-testid={`button-remove-phone-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Addresses Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="dark:text-slate-200 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Official Email Addresses
                  </Label>
                  {isEditing && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addEmail}
                      data-testid="button-add-email"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Email
                    </Button>
                  )}
                </div>
                {parseEmails(formData.schoolEmails).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No email addresses added. Click "Add Email" to add one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {parseEmails(formData.schoolEmails).map((email, index) => (
                      <div key={index} className="flex items-center gap-2" data-testid={`email-entry-${index}`}>
                        <Input
                          type="email"
                          value={email}
                          readOnly={!isEditing}
                          placeholder="email@school.com"
                          onChange={(e) => updateEmail(index, e.target.value)}
                          className="flex-1 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid={`input-email-${index}`}
                        />
                        {isEditing && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeEmail(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            data-testid={`button-remove-email-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Website Settings Section */}
              <div className="border-t pt-4 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website Settings
                </h4>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="websiteTitle" className="dark:text-slate-200">Website Title (Browser Tab)</Label>
                    <Input
                      id="websiteTitle"
                      data-testid="input-website-title"
                      value={formData.websiteTitle}
                      readOnly={!isEditing}
                      placeholder="e.g. Treasure-Home School"
                      onChange={(e) => setFormData({ ...formData, websiteTitle: e.target.value })}
                      className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500">This appears in the browser tab</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footerText" className="dark:text-slate-200">Footer Text</Label>
                    <Input
                      id="footerText"
                      data-testid="input-footer-text"
                      value={formData.footerText}
                      readOnly={!isEditing}
                      placeholder="e.g. © 2026 School Name. All rights reserved."
                      onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                      className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500">Appears at the bottom of every page</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grading Configuration */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <GraduationCap className="h-5 w-5" />
                Grading Configuration
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Configure how grades and report cards are calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Weights */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium dark:text-slate-200">Score Weights</Label>
                </div>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="testWeight" className="text-sm dark:text-slate-300">
                      Test Weight (%)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="testWeight"
                        type="number"
                        min="0"
                        max="100"
                        data-testid="input-test-weight"
                        value={formData.testWeight}
                        readOnly={!isEditing}
                        onChange={(e) => handleTestWeightChange(e.target.value)}
                        className="w-24 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                      <div className="flex-1">
                        <Progress value={formData.testWeight} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examWeight" className="text-sm dark:text-slate-300">
                      Exam Weight (%)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="examWeight"
                        type="number"
                        min="0"
                        max="100"
                        data-testid="input-exam-weight"
                        value={formData.examWeight}
                        readOnly={!isEditing}
                        onChange={(e) => handleExamWeightChange(e.target.value)}
                        className="w-24 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                      <div className="flex-1">
                        <Progress value={formData.examWeight} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation indicator */}
                <div className={`flex items-center gap-2 text-sm ${weightsValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {weightsValid ? (
                    <span>Test ({formData.testWeight}%) + Exam ({formData.examWeight}%) = 100%</span>
                  ) : (
                    <span>Weights must add up to 100% (currently {formData.testWeight + formData.examWeight}%)</span>
                  )}
                </div>
              </div>

              {/* Grading Scale */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gradingScale" className="text-sm dark:text-slate-300">
                    Default Grading Scale
                  </Label>
                  <Select 
                    disabled={!isEditing}
                    value={formData.defaultGradingScale} 
                    onValueChange={(value) => setFormData({ ...formData, defaultGradingScale: value })}
                  >
                    <SelectTrigger className="w-full md:w-64 dark:bg-slate-900 dark:border-slate-700" data-testid="select-grading-scale">
                      <SelectValue placeholder="Select grading scale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (A-F)</SelectItem>
                      <SelectItem value="waec">WAEC (A1-F9)</SelectItem>
                      <SelectItem value="percentage">Percentage Based</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This determines how percentage scores are converted to letter grades
                  </p>
                </div>

                {/* Grading Scale Preview */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium dark:text-slate-200">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Grade Scale Preview
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Score Range</TableHead>
                          <TableHead className="text-xs">Grade</TableHead>
                          <TableHead className="text-xs">Points</TableHead>
                          <TableHead className="text-xs">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(GRADING_SCALES[formData.defaultGradingScale] || GRADING_SCALES.standard).ranges.map((range, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium">
                              {range.min} - {range.max}%
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${getGradeColor(range.grade)} ${getGradeBgColor(range.grade)} border-0`}
                              >
                                {range.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{range.points.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{range.remarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Score Aggregation Mode */}
              <div className="space-y-2">
                <Label htmlFor="scoreAggregationMode" className="text-sm dark:text-slate-300">
                  Score Aggregation Mode
                </Label>
                <Select 
                  disabled={!isEditing}
                  value={formData.scoreAggregationMode} 
                  onValueChange={(value) => setFormData({ ...formData, scoreAggregationMode: value })}
                >
                  <SelectTrigger className="w-full md:w-64 dark:bg-slate-900 dark:border-slate-700" data-testid="select-aggregation-mode">
                    <SelectValue placeholder="Select aggregation mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last">Use Last Score</SelectItem>
                    <SelectItem value="best">Use Best Score</SelectItem>
                    <SelectItem value="average">Use Average Score</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  When a student has multiple test/exam scores, this determines which one is used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Report Card Behavior */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 border-purple-200 dark:border-purple-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FileText className="h-5 w-5" />
                Report Card Behavior
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Configure how report cards are generated and displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Auto-Create Report Cards</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Automatically create a report card when a student takes their first exam in a term
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.autoCreateReportCard}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoCreateReportCard: checked })
                  }
                  data-testid="switch-auto-create-report"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Show Grade Breakdown</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Display test and exam scores separately on report cards
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.showGradeBreakdown}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showGradeBreakdown: checked })
                  }
                  data-testid="switch-show-breakdown"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Allow Teacher Score Overrides</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Allow teachers to manually override auto-calculated scores
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.allowTeacherOverrides}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowTeacherOverrides: checked })
                  }
                  data-testid="switch-allow-overrides"
                />
              </div>
            </CardContent>
          </Card>

          {/* Module Management */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Settings2 className="h-5 w-5" />
                Module Management
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Enable or disable system modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Exams Module</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Enable exam creation and management
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.enableExamsModule}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableExamsModule: checked })
                  }
                  data-testid="switch-exams-module"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Attendance Module</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Enable attendance tracking
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.enableAttendanceModule}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableAttendanceModule: checked })
                  }
                  data-testid="switch-attendance-module"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Results Module</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Enable results and report cards
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.enableResultsModule}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableResultsModule: checked })
                  }
                  data-testid="switch-results-module"
                />
              </div>
            </CardContent>
          </Card>

          {/* User Management Settings */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="dark:text-white">User Management Settings</CardTitle>
              <CardDescription className="dark:text-slate-400">
                Control user visibility, access permissions, and data retention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Hide Admin Accounts from Admins</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    When enabled, regular Admins cannot see or manage Super Admin and Admin accounts. Only Super Admins have full access.
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.hideAdminAccountsFromAdmins}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hideAdminAccountsFromAdmins: checked })
                  }
                  data-testid="switch-hide-admins"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retentionDays" className="text-sm dark:text-slate-300">Deleted User Retention (Days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  min="1"
                  max="365"
                  data-testid="input-retention-days"
                  value={formData.deletedUserRetentionDays}
                  readOnly={!isEditing}
                  onChange={(e) => setFormData({ ...formData, deletedUserRetentionDays: parseInt(e.target.value) || 30 })}
                  className="w-full md:w-32 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days to keep deleted user data before permanent removal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
