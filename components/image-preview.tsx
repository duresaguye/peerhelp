"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ZoomIn } from "lucide-react"

interface ImagePreviewProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export default function ImagePreview({ src, alt, width, height, className }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="relative group cursor-zoom-in" onClick={() => setIsOpen(true)}>
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width || 300}
          height={height || 200}
          className={`rounded-md ${className || ""}`}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
          <ZoomIn className="h-6 w-6 text-white" />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none">
          <div className="relative">
            <Image
              src={src || "/placeholder.svg"}
              alt={alt}
              width={1200}
              height={800}
              className="rounded-md max-h-[80vh] w-auto object-contain"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
