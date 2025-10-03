'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GenerationOptions } from '@/lib/types';
import { Separator } from './ui/separator';

interface ConfigurationPanelProps {
  options: GenerationOptions;
  setOptions: (options: GenerationOptions) => void;
  isLoading: boolean;
}

export default function ConfigurationPanel({ options, setOptions, isLoading }: ConfigurationPanelProps) {
  const handleOptionChange = <K extends keyof GenerationOptions>(key: K, value: GenerationOptions[K]) => {
    setOptions({ ...options, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">2. Configure Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="packageName">Package Name</Label>
          <Input
            id="packageName"
            value={options.packageName}
            onChange={(e) => handleOptionChange('packageName', e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
                <Switch
                    id="useLombok"
                    checked={options.useLombok}
                    onCheckedChange={(c) => handleOptionChange('useLombok', c)}
                    disabled={isLoading}
                />
                <Label htmlFor="useLombok">Use Lombok</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Switch
                    id="useOptional"
                    checked={options.useOptional}
                    onCheckedChange={(c) => handleOptionChange('useOptional', c)}
                    disabled={isLoading}
                />
                <Label htmlFor="useOptional">Use Optional&lt;T&gt;</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Switch
                    id="useBoxedPrimitives"
                    checked={options.useBoxedPrimitives}
                    onCheckedChange={(c) => handleOptionChange('useBoxedPrimitives', c)}
                    disabled={isLoading}
                />
                <Label htmlFor="useBoxedPrimitives">Use Boxed Primitives</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Switch
                    id="generateHelpers"
                    checked={options.generateHelpers}
                    onCheckedChange={(c) => handleOptionChange('generateHelpers', c)}
                    disabled={isLoading || options.useLombok}
                />
                <Label htmlFor="generateHelpers" className={options.useLombok ? "text-muted-foreground" : ""}>Generate Helpers</Label>
            </div>
        </div>
        
        <Separator />

        <div className="space-y-4">
            <Label>Validation</Label>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="useValidationAnnotations"
                        checked={options.useValidationAnnotations}
                        onCheckedChange={(c) => handleOptionChange('useValidationAnnotations', c)}
                        disabled={isLoading}
                    />
                    <Label htmlFor="useValidationAnnotations">Enable Validation</Label>
                </div>
                 <RadioGroup
                    value={options.validationApi}
                    onValueChange={(v: 'jakarta' | 'javax') => handleOptionChange('validationApi', v)}
                    disabled={isLoading || !options.useValidationAnnotations}
                    className="flex"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="jakarta" id="jakarta" />
                        <Label htmlFor="jakarta" className={!options.useValidationAnnotations ? "text-muted-foreground" : ""}>Jakarta</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="javax" id="javax" />
                        <Label htmlFor="javax" className={!options.useValidationAnnotations ? "text-muted-foreground" : ""}>Javax</Label>
                    </div>
                </RadioGroup>
            </div>
        </div>

        <Separator />

        <div className="space-y-2">
            <Label>JSON Annotations</Label>
             <RadioGroup
                defaultValue="jackson"
                onValueChange={(v) => handleOptionChange('useJackson', v === 'jackson')}
                disabled={isLoading}
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="jackson" id="jackson" />
                    <Label htmlFor="jackson">Jackson (@JsonProperty)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gson" id="gson" disabled />
                    <Label htmlFor="gson" className="text-muted-foreground">Gson (@SerializedName) - Not implemented</Label>
                </div>
            </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Date/Time Type</Label>
                <Select value={options.dateType} onValueChange={(v: 'OffsetDateTime' | 'String') => handleOptionChange('dateType', v)} disabled={isLoading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="OffsetDateTime">OffsetDateTime</SelectItem>
                        <SelectItem value="String">String</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Enum Style</Label>
                 <Select value={options.enumType} onValueChange={(v: 'enum' | 'String') => handleOptionChange('enumType', v)} disabled={isLoading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="enum">Java Enum</SelectItem>
                        <SelectItem value="String" disabled>String Constants</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
