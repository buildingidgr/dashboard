'use client'

import { useState, useEffect } from 'react'
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"
import { getProfessionalInfo, updateProfessionalInfo } from '@/src/services/profile'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import LocationInput from "@/components/ui/location-input"

const traditionalFields = [
    "Civil Engineer",
    "Architectural Engineer",
    "Mechanical Engineer",
    "Chemical Engineer",
    "Electrical Engineer",
    "Surveying and Rural Engineer",
    "Naval Architect and Marine Engineer"
];

const specializedFields = [
    "Electronics Engineer",
    "Mining and Metallurgical Engineer",
    "Urban, Regional and Development Planning Engineer",
    "Automation Engineer",
    "Environmental Engineer",
    "Production and Management Engineer",
    "Acoustical Engineer",
    "Materials Engineer",
    "Product and Systems Design Engineer"
];

export function ProfessionalInfo() {
    const { control, handleSubmit, reset } = useFormContext();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfessionalInfo = async () => {
            try {
                const data = await getProfessionalInfo();
                reset({
                    profession: {
                        current: data.profession.current
                    },
                    amtee: data.amtee,
                    workingAddress: {
                        address: data.areaOfOperation.address,
                        coordinates: {
                            lat: data.areaOfOperation.coordinates.latitude,
                            lng: data.areaOfOperation.coordinates.longitude
                        }
                    }
                });
            } catch (err) {
                console.error('Error fetching professional info:', err);
                setError('Failed to load professional data');
                toast.error('Failed to load professional data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfessionalInfo();
    }, [reset]);

    const onSubmit = async (data: any) => {
        try {
            setIsLoading(true);
            const locationData = data.workingAddress || {};
            
            await updateProfessionalInfo({
                profession: {
                    current: data.profession.current
                },
                amtee: data.amtee,
                areaOfOperation: {
                    address: locationData.address || '',
                    primary: locationData.address ? locationData.address.split(',')[0].trim() : '',
                    coordinates: {
                        latitude: locationData.coordinates?.lat || 0,
                        longitude: locationData.coordinates?.lng || 0
                    }
                }
            });
            toast.success('Professional information updated successfully', {
                description: 'Your changes have been saved.'
            });
        } catch (err) {
            console.error('Professional info update error:', err);
            toast.error('Failed to update professional info', {
                description: err instanceof Error ? err.message : 'There was a problem saving your changes.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="px-4 border-none shadow-none">
            <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Enter your professional information. Working address will affect the public project visibility of your profile.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={control}
                        name="profession.current"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Profession</FormLabel>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value || ""} 
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a profession" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectSeparator />
                                        <SelectGroup>
                                            <SelectLabel>Traditional Fields</SelectLabel>
                                            {traditionalFields.map((field) => (
                                                <SelectItem key={field} value={field}>
                                                    {field}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectSeparator />
                                        <SelectGroup>
                                            <SelectLabel>Specialized Fields</SelectLabel>
                                            {specializedFields.map((field) => (
                                                <SelectItem key={field} value={field}>
                                                    {field}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="amtee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>AMTEE</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="workingAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Working Address</FormLabel>
                                <FormControl>
                                    <LocationInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        autoComplete="address-line1"
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end space-x-2">
                        <Button type="submit" disabled={isLoading}>Save Changes</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

