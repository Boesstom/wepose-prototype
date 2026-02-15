"use client"

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon, Delete01Icon, File01Icon } from "@hugeicons/core-free-icons"

import {
  getDocuments,
  deleteDocument,
  type Document,
} from "@/lib/supabase/documents"

export interface DocumentLibraryHandle {
  refresh: () => void
}

export const DocumentLibrary = forwardRef<DocumentLibraryHandle>(function DocumentLibrary(_props, ref) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getDocuments()
      setDocuments(data)
    } catch (err) {
      console.error("Failed to fetch documents:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    refresh: fetchDocuments,
  }))

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id)
      await fetchDocuments()
    } catch (err) {
      console.error("Failed to delete document:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading documents...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Allowed Formats</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No documents found. Add your first document.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon 
                          icon={File01Icon} 
                          strokeWidth={2} 
                          className="size-4 text-muted-foreground" 
                      />
                      {doc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {doc.formats.map(fmt => (
                          <Badge key={fmt} variant="secondary" className="text-xs">
                              {fmt}
                          </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                     {doc.sub_documents.length > 0 ? (
                         <Badge variant="outline">{doc.sub_documents.length} Sub-docs</Badge>
                     ) : doc.allow_multiple ? (
                         <Badge variant="outline">Multiple Files</Badge>
                     ) : (
                         <span className="text-muted-foreground text-sm">Single File</span>
                     )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
})
