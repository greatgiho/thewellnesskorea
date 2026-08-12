// components/community/community-editor.tsx

"use client"

import { useCallback, useEffect, useRef } from "react"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  Quote,
} from "lucide-react"
import { IMAGE_ACCEPT } from "@/lib/ui/photo-upload"

type CommunityEditorProps = {
  content: string
  onChange: (html: string) => void
  postId: string
  disabled?: boolean
  uploadImage?: (file: File) => Promise<string | undefined>
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-foreground transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background hover:bg-muted"
      }`}
    >
      {children}
    </button>
  )
}

export function CommunityEditor({
  content,
  onChange,
  postId,
  disabled = false,
  uploadImage,
}: CommunityEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false }),
    ],
    content: content || "<p></p>",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "journal-editor-content min-h-[320px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = content || "<p></p>"
    const current = editor.getHTML()
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [content, editor])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", previous ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(() => {
    if (!editor || !uploadImage) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = IMAGE_ACCEPT
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      if (file.size > MAX_FILE_SIZE) {
        window.alert("Max file size is 5MB.")
        return
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        window.alert("JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.")
        return
      }

      try {
        const imageUrl = await uploadImage(file)
        if (imageUrl) {
          editor.chain().focus().setImage({ src: imageUrl, alt: "" }).run()
        }
        else {
          window.alert("Image upload returned no URL.")
        }
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Upload failed.")
      }
    }
    input.click()
  }, [editor, uploadImage])

  if (!editor) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-12 text-sm text-muted-foreground">
        Loading editor…
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 p-2">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Link" onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={insertImage}>
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
