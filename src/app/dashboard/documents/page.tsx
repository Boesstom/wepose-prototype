"use client"

import { useRef } from "react"
import { DocumentLibrary } from "@/components/documents/document-library"
import { AddDocumentModal } from "@/components/documents/add-document-modal"

export default function DocumentLibraryPage() {
  const libraryRef = useRef<{ refresh: () => void }>(null)

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Document Library</h2>
        <div className="flex items-center space-x-2">
           <AddDocumentModal onDocumentAdded={() => libraryRef.current?.refresh()} />
        </div>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
         <DocumentLibrary ref={libraryRef} />
      </div>
    </div>
  )
}
