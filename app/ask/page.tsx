"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, ImagePlus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import Navbar from "@/components/navbar"

interface UploadedImage {
  id: string
  file: File
  preview: string
}

export default function AskQuestion() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { requireAuth, isAuthenticated, isLoading } = useAuthRedirect()

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    requireAuth("ask a question")
    return null
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()])
        setTagInput("")
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setIsUploading(true)

    const newImages: UploadedImage[] = []

    Array.from(e.target.files).forEach((file) => {
      // Create a preview URL for the image
      const preview = URL.createObjectURL(file)
      newImages.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        preview,
      })
    })

    // Add new images to the existing ones
    setImages([...images, ...newImages])
    setIsUploading(false)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = images.find((img) => img.id === imageId)
    if (imageToRemove) {
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(imageToRemove.preview)
    }

    setImages(images.filter((img) => img.id !== imageId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim() || tags.length === 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, we would upload images to a storage service
      // For now, we'll just use the preview URLs
      const imageUrls = images.map((img) => img.preview)

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          tags,
          images: imageUrls,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create question")
      }

      const question = await response.json()

      toast.success("Your question has been posted")

      // Redirect to the new question
      router.push(`/questions/${question._id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post your question")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm hover:underline">
            ← Back to questions
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., How do I solve this specific math problem?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Be specific and imagine you're asking a question to another person
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Body</Label>
                <Textarea
                  id="content"
                  placeholder="Explain your question in detail..."
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include all the information someone would need to answer your question
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Images</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative group w-32 h-32 border rounded-md overflow-hidden">
                        <Image
                          src={image.preview || "/placeholder.svg"}
                          alt="Uploaded image"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image.id)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-32 h-32 flex flex-col items-center justify-center gap-2 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                      <span className="text-xs">Add Image</span>
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <p className="text-xs text-muted-foreground">
                    Add images to help explain your question (optional). Supported formats: JPG, PNG, GIF.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {tag} tag</span>
                      </button>
                    </Badge>
                  ))}
                  {tags.length < 5 && (
                    <Input
                      id="tags"
                      placeholder="Add up to 5 tags..."
                      className="w-40 flex-grow"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add up to 5 tags to describe what your question is about
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim() || tags.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Your Question"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  )
}
