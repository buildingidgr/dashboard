import { FileQuestion } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface EmptyStateProps {
  onReset: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">No projects found</CardTitle>
        <CardDescription className="text-center">We couldn't find any projects matching your criteria.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <FileQuestion className="w-16 h-16 text-muted-foreground" />
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={onReset}>Reset Filters</Button>
      </CardFooter>
    </Card>
  )
}

