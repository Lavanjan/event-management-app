import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Palette, Sun, Moon, Monitor, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useUserPreferences, useUpdateUserPreferences } from '../../hooks/useSettings';

const themeSchema = z.object({
  themeMode: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
});

type ThemeFormData = z.infer<typeof themeSchema>;

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
];

const dateFormats = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (12/31/2023)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (31/12/2023)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2023-12-31)' },
  { value: 'MMM dd, yyyy', label: 'MMM DD, YYYY (Dec 31, 2023)' },
  { value: 'dd MMM yyyy', label: 'DD MMM YYYY (31 Dec 2023)' },
];

export function ThemeSettingsPage() {
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      themeMode: 'light',
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
    },
  });

  // Update form when preferences are loaded
  React.useEffect(() => {
    if (preferences) {
      setValue('themeMode', preferences.themeMode || 'light');
      setValue('language', preferences.language || 'en');
      setValue('dateFormat', preferences.dateFormat || 'MM/dd/yyyy');
      setValue('timeFormat', preferences.timeFormat || '12h');
    }
  }, [preferences, setValue]);

  const onSubmit = (data: ThemeFormData) => {
    updatePreferences.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Theme Settings</h1>
        <p className="text-muted-foreground">
          Customize your interface theme and appearance preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Theme Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Choose how the interface looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme Mode</Label>
              <RadioGroup
                value={watch('themeMode')}
                onValueChange={(value) => setValue('themeMode', value as 'light' | 'dark' | 'system')}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                  <RadioGroupItem value="light" id="light" />
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <Label htmlFor="light" className="cursor-pointer">
                      Light
                    </Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                  <RadioGroupItem value="dark" id="dark" />
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <Label htmlFor="dark" className="cursor-pointer">
                      Dark
                    </Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                  <RadioGroupItem value="system" id="system" />
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <Label htmlFor="system" className="cursor-pointer">
                      System
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle>Localization</CardTitle>
            <CardDescription>
              Configure language and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={watch('language')}
                  onValueChange={(value) => setValue('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <RadioGroup
                  value={watch('timeFormat')}
                  onValueChange={(value) => setValue('timeFormat', value as '12h' | '24h')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12h" id="12h" />
                    <Label htmlFor="12h" className="cursor-pointer">
                      12 Hour (2:30 PM)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="24h" />
                    <Label htmlFor="24h" className="cursor-pointer">
                      24 Hour (14:30)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={watch('dateFormat')}
                onValueChange={(value) => setValue('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isDirty || updatePreferences.isPending}
            className="min-w-[120px]"
          >
            {updatePreferences.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
