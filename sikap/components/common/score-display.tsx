import { Star } from "lucide-react"

interface ScoreDisplayProps {
  score: number
  maxScore?: number
  showLabel?: boolean
}

export function ScoreDisplay({ score, maxScore = 10, showLabel = true }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium">
        {score}
        {showLabel && `/${maxScore}`}
      </span>
    </div>
  )
}
