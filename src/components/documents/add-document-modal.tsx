"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { PlusSignIcon, Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createDocument } from "@/lib/supabase/documents"

const FORMATS = [
  { id: "PDF", label: "PDF" },
  { id: "JPG", label: "JPG" },
  { id: "PNG", label: "PNG" },
]

interface AddDocumentModalProps {
  onDocumentAdded?: () => void
}

export function AddDocumentModal({ onDocumentAdded }: AddDocumentModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [formats, setFormats] = useState<string[]>([])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [subDocuments, setSubDocuments] = useState<string[]>([])
  const [newSubDoc, setNewSubDoc] = useState("")
  const [saving, setSaving] = useState(false)

  const toggleFormat = (formatId: string) => {
    setFormats((prev) =>
      prev.includes(formatId)
        ? prev.filter((f) => f !== formatId)
        : [...prev, formatId]
    )
  }

  const addSubDocument = () => {
    if (newSubDoc.trim()) {
      setSubDocuments([...subDocuments, newSubDoc.trim()])
      setNewSubDoc("")
    }
  }

  const removeSubDocument = (index: number) => {
    setSubDocuments(subDocuments.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setFormats([])
    setAllowMultiple(false)
    setSubDocuments([])
    setNewSubDoc("")
  }

  const handleSave = async () => {
    if (!name.trim() || formats.length === 0) return

    try {
      setSaving(true)
      await createDocument({
        name: name.trim(),
        description: description.trim() || null,
        formats,
        allow_multiple: allowMultiple,
        sub_documents: subDocuments,
      })
      resetForm()
      setOpen(false)
      onDocumentAdded?.()
    } catch (err) {
      console.error("Failed to create document:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger
        render={
          <Button>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 mr-2" />
            Add New Document
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>
            Configure document requirements. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              placeholder="E.g., Passport Cover" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Allowed Formats</Label>
            <div className="flex flex-wrap gap-4">
              {FORMATS.map((format) => (
                <div key={format.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={format.id} 
                    checked={formats.includes(format.id)}
                    onCheckedChange={() => toggleFormat(format.id)}
                  />
                  <Label htmlFor={format.id} className="font-normal cursor-pointer">
                    {format.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Multiple Attachments</Label>
              <p className="text-sm text-muted-foreground">
                Allow multiple files to be uploaded for this document?
              </p>
            </div>
            <Switch 
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
            />
          </div>

          <div className="grid gap-2">
             <Label>Sub-documents (Optional)</Label>
             <p className="text-xs text-muted-foreground mb-2">
                Define specific sub-documents if needed (e.g., Year 1, Year 2).
             </p>
             <div className="flex gap-2">
                <Input 
                    placeholder="Sub-document name" 
                    value={newSubDoc}
                    onChange={(e) => setNewSubDoc(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addSubDocument();
                        }
                    }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addSubDocument}>
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
                </Button>
             </div>
             <div className="space-y-2 mt-2">
                {subDocuments.map((subDoc, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span>{subDoc}</span>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={() => removeSubDocument(index)}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                        </Button>
                    </div>
                ))}
             </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Description..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={saving || !name.trim() || formats.length === 0}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
