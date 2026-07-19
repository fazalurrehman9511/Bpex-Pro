import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { uploadBlogImage } from '../../utils/api'

const FONT_OPTIONS = ['sans-serif', 'serif', 'monospace', 'arial', 'times-new-roman', 'georgia', 'verdana']
const SIZE_OPTIONS = ['12px', '14px', '16px', '18px', '20px', '24px', '32px']

const Font = Quill.import('formats/font')
Font.whitelist = FONT_OPTIONS
Quill.register(Font, true)

const SizeStyle = Quill.import('attributors/style/size')
SizeStyle.whitelist = SIZE_OPTIONS
Quill.register(SizeStyle, true)

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function BlogRichEditor({ value, onChange }) {
  const containerRef = useRef(null)
  const toolbarRef = useRef(null)
  const quillRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || !toolbarRef.current || quillRef.current) return

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: 'Write your blog post…',
      modules: {
        toolbar: {
          container: toolbarRef.current,
          handlers: {
            image() {
              const input = document.createElement('input')
              input.setAttribute('type', 'file')
              input.setAttribute('accept', 'image/*')
              input.click()

              input.onchange = async () => {
                const file = input.files?.[0]
                if (!file) return

                try {
                  const dataUrl = await readFileAsDataUrl(file)
                  const { url } = await uploadBlogImage(dataUrl)
                  const range = quill.getSelection(true)
                  quill.insertEmbed(range.index, 'image', url)
                  quill.setSelection(range.index + 1)
                } catch (err) {
                  alert(err.message || 'Image upload failed')
                }
              }
            },
          },
        },
      },
    })

    quillRef.current = quill
    quill.root.innerHTML = value || ''

    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML)
    })

    return () => {
      quillRef.current = null
    }
  }, [])

  return (
    <div className="blog-rich-editor rounded border border-border bg-navy overflow-hidden">
      <div ref={toolbarRef} className="blog-rich-editor-toolbar">
        <span className="ql-formats">
          <select className="ql-font" defaultValue="sans-serif" aria-label="Font family" />
          <select className="ql-size" defaultValue="16px" aria-label="Font size" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-bold" aria-label="Bold" />
          <button type="button" className="ql-italic" aria-label="Italic" />
          <button type="button" className="ql-underline" aria-label="Underline" />
          <button type="button" className="ql-strike" aria-label="Strikethrough" />
        </span>
        <span className="ql-formats">
          <select className="ql-color" aria-label="Text color" />
          <select className="ql-background" aria-label="Background color" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-header" value="1" aria-label="Heading 1" />
          <button type="button" className="ql-header" value="2" aria-label="Heading 2" />
          <button type="button" className="ql-header" value="3" aria-label="Heading 3" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-list" value="ordered" aria-label="Numbered list" />
          <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" />
        </span>
        <span className="ql-formats">
          <select className="ql-align" aria-label="Alignment" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-link" aria-label="Link" />
          <button type="button" className="ql-image" aria-label="Insert image" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-clean" aria-label="Clear formatting" />
        </span>
      </div>
      <div ref={containerRef} className="blog-rich-editor-body" />
    </div>
  )
}
