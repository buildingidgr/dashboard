import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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


export default function SelectSeperator() {
  return (
    <div className="space-y-2">
      <Label htmlFor="select-26">Select with separator</Label>
      <Select defaultValue="s1">
        <SelectTrigger id="select-26">
          <SelectValue placeholder="Select framework" />
        </SelectTrigger>
        <SelectContent>
        <SelectSeparator />
            <SelectLabel>Traditional Fields</SelectLabel>
            {traditionalFields.map((field) => (
                <SelectItem key={field} value={field}>
                    {field}
                </SelectItem>
            ))}
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
    </div>
  );
}
