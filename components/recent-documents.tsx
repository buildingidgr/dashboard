import { FileText, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Document {
  title: string
  lastModified: string
  icon?: React.ReactNode
}

export function RecentDocuments() {
  // This would typically come from an API
  const recentDocs: Document[] = [
    { title: "Auth API documentation", lastModified: "23h ago", icon: <FileText className="w-4 h-4" /> },
    { title: "New page", lastModified: "10h ago", icon: <FileText className="w-4 h-4" /> },
    { title: "Profile service documentation", lastModified: "Dec 24", icon: <FileText className="w-4 h-4" /> },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recently visited
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {recentDocs.map((doc, index) => (
            <div
              key={index}
              className="min-w-[200px] p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                {doc.icon}
                <h3 className="font-medium">{doc.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {doc.lastModified}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 