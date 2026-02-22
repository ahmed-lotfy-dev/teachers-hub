import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-[transform,opacity] disabled:pointer-events-none disabled:opacity-70 outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-br from-cyan-300 to-yellow-300 text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] hover:-translate-y-0.5",
        secondary:
          "border-2 border-sky-200 bg-white text-slate-900 hover:-translate-y-0.5",
        ghost: "bg-transparent text-slate-700 hover:bg-sky-100",
      },
      size: {
        default: "px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
