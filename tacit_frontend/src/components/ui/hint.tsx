import * as React from "react"
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const hintVariants = cva(
  "flex items-start gap-2 rounded-md p-3 text-sm",
  {
    variants: {
      variant: {
        tip: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        info: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        help: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        warning: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
        error: "bg-red-500/10 text-red-300 border border-red-500/20",
        success: "bg-green-500/10 text-green-300 border border-green-500/20",
      },
    },
    defaultVariants: {
      variant: "tip",
    },
  }
)

export interface HintProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof hintVariants> {}

const iconMap = {
  tip: Info,
  info: Info,
  help: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
}

function Hint({ className, variant = "tip", children, ...props }: HintProps) {
  const Icon = iconMap[variant || "tip"]
  
  return (
    <div className={cn(hintVariants({ variant }), className)} {...props}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export { Hint, hintVariants }

